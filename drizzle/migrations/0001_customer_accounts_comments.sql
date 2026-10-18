-- New accounts are shoppers now; never auto-grant admin.
drop trigger if exists on_auth_user_created_admin on auth.users;
drop function if exists public.handle_new_admin();

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 2 and 24),
  color smallint not null default 0 check (color between 0 and 99),
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles are public" on public.profiles for select to anon, authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text := left(regexp_replace(coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1)), '[^A-Za-z0-9_.]', '', 'g'), 18);
  pick text;
  col int := coalesce((new.raw_user_meta_data->>'color')::int, floor(random()*100)::int);
begin
  if char_length(base) < 2 then base := 'user'; end if;
  pick := base;
  while exists (select 1 from public.profiles where lower(username) = lower(pick)) loop
    pick := base || floor(random()*10000)::int;
  end loop;
  insert into public.profiles(id, username, color) values (new.id, pick, least(greatest(col, 0), 99));
  return new;
end $$;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.handle_new_user();

insert into public.profiles(id, username, color)
select id, 'onur', 0 from auth.users on conflict do nothing;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_product_idx on public.comments(product_id, created_at);
grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "Comments are public" on public.comments for select to anon, authenticated using (true);
create policy "Users post as themselves" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own comments, admins any" on public.comments for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create table public.user_gets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  status text not null default 'getting' check (status in ('getting','got')),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, update, delete on public.user_gets to authenticated;
grant all on public.user_gets to service_role;
alter table public.user_gets enable row level security;
create policy "Users manage own GET history" on public.user_gets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);