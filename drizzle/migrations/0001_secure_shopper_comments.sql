DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; pick text; col integer;
BEGIN
base := trim(coalesce(new.raw_user_meta_data->>'username', 'shopper'));
IF base !~ '^[A-Za-z0-9_.]{2,24}$' THEN base := 'shopper'; END IF;
pick := base;
WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username)=lower(pick)) LOOP
pick := left(base,18) || '_' || floor(random()*10000)::integer;
END LOOP;
col := CASE WHEN coalesce(new.raw_user_meta_data->>'color','') ~ '^[0-9]{1,2}$' THEN (new.raw_user_meta_data->>'color')::integer ELSE 0 END;
INSERT INTO public.profiles(id,username,color) VALUES(new.id,pick,col);
RETURN new;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE OR REPLACE FUNCTION public.validate_comment_parent() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
IF NEW.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.comments WHERE id=NEW.parent_id AND product_id=NEW.product_id) THEN
RAISE EXCEPTION 'Replies must belong to the same product';
END IF;
RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_comment_parent ON public.comments;
CREATE TRIGGER validate_comment_parent BEFORE INSERT OR UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.validate_comment_parent();
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[A-Za-z0-9_.]{2,24}$') NOT VALID;
GRANT SELECT ON public.profiles,public.comments TO anon,authenticated;
GRANT INSERT,UPDATE ON public.profiles TO authenticated;
GRANT INSERT,DELETE ON public.comments TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_gets TO authenticated;
GRANT ALL ON public.profiles,public.comments,public.user_gets TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.user_roles FROM anon,authenticated;