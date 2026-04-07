-- 1. Fix the infinite recursion in RLS policies by using a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
DECLARE
  role_val public.user_role;
BEGIN
  SELECT role INTO role_val FROM public.users WHERE id = auth.uid();
  RETURN role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop all existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update roles" ON public.users;

DROP POLICY IF EXISTS "Anyone can view approved songs" ON public.songs;
DROP POLICY IF EXISTS "Publishers can view their own pending songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can view all songs" ON public.songs;
DROP POLICY IF EXISTS "Publishers and admins can insert songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can update songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can delete songs" ON public.songs;

DROP POLICY IF EXISTS "Anyone can view approved keys" ON public.song_keys;
DROP POLICY IF EXISTS "Publishers can view their own pending keys" ON public.song_keys;
DROP POLICY IF EXISTS "Admins can view all keys" ON public.song_keys;
DROP POLICY IF EXISTS "Publishers and admins can insert keys" ON public.song_keys;
DROP POLICY IF EXISTS "Admins can update keys" ON public.song_keys;
DROP POLICY IF EXISTS "Admins can delete keys" ON public.song_keys;

-- 3. Recreate Users policies
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can update roles" ON public.users FOR UPDATE USING (public.get_user_role() = 'admin');

-- 4. Recreate Songs policies
CREATE POLICY "Anyone can view approved songs" ON public.songs FOR SELECT USING (status = 'approved');
CREATE POLICY "Publishers can view their own pending songs" ON public.songs FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins can view all songs" ON public.songs FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "Publishers and admins can insert songs" ON public.songs FOR INSERT WITH CHECK (public.get_user_role() IN ('publisher', 'admin'));
CREATE POLICY "Admins can update songs" ON public.songs FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can delete songs" ON public.songs FOR DELETE USING (public.get_user_role() = 'admin');

-- 5. Recreate Song Keys policies
CREATE POLICY "Anyone can view approved keys" ON public.song_keys FOR SELECT USING (status = 'approved');
CREATE POLICY "Publishers can view their own pending keys" ON public.song_keys FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins can view all keys" ON public.song_keys FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "Publishers and admins can insert keys" ON public.song_keys FOR INSERT WITH CHECK (public.get_user_role() IN ('publisher', 'admin'));
CREATE POLICY "Admins can update keys" ON public.song_keys FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY "Admins can delete keys" ON public.song_keys FOR DELETE USING (public.get_user_role() = 'admin');

-- 6. Fix the trigger function (add search_path and explicit schema references)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE 
      WHEN new.email = 'khiemvinhtran1112@gmail.com' THEN 'admin'::public.user_role 
      ELSE 'user'::public.user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
