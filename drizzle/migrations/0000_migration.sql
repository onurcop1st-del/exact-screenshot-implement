create type public.app_role as enum ('admin');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.handle_new_admin() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.user_roles(user_id, role) values (new.id,'admin') on conflict do nothing; return new; end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_new_admin();

create table public.products (id uuid primary key default gen_random_uuid(), code text not null unique default upper(substr(md5(random()::text),1,6)), category text not null check (category in ('cloths','caps','accessories')), title text not null, description text not null default '', price numeric not null default 0, stock_count int not null default 0, image_path text, created_at timestamptz not null default now());
grant select on public.products to anon, authenticated; grant insert, update, delete on public.products to authenticated; grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read" on public.products for select to anon, authenticated using (true);
create policy "admin insert" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.orders (id uuid primary key default gen_random_uuid(), order_code text not null unique, items_json jsonb not null, created_at timestamptz not null default now());
grant insert on public.orders to anon, authenticated; grant select on public.orders to authenticated; grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "anyone create" on public.orders for insert to anon, authenticated with check (jsonb_typeof(items_json)='array');
create policy "admin read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create or replace function public.get_order(_code text) returns jsonb language sql stable security definer set search_path=public as $$ select items_json from public.orders where order_code = upper(_code) $$;
grant execute on function public.get_order(text) to anon, authenticated;

create policy "product images read" on storage.objects for select to anon, authenticated using (bucket_id='products');
create policy "admin upload" on storage.objects for insert to authenticated with check (bucket_id='products' and public.has_role(auth.uid(),'admin'));
create policy "admin delete img" on storage.objects for delete to authenticated using (bucket_id='products' and public.has_role(auth.uid(),'admin'));

insert into public.products (code, category, title, description, price, stock_count) values
('TEE001','cloths','Onur Heavy Tee','Oversized heavyweight cotton tee, black',15000,5),
('HOD001','cloths','Onur Hoodie','Boxy fleece hoodie with puff print',32000,3),
('JOG001','cloths','Cargo Joggers','Relaxed cargo joggers, washed grey',25000,4),
('CAP001','caps','Slouchy Beanie','Rib knit slouchy beanie',8000,6),
('CAP002','caps','Skull Cap','Fitted skull cap, embroidered logo',7000,5),
('ACC001','accessories','Chain Necklace','Steel chain with Onur pendant',12000,2);