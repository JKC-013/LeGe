-- Clean up existing structures
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.favourites CASCADE;
DROP TABLE IF EXISTS public.songs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Also clean up old tables that might have been there
DROP TABLE IF EXISTS public.song_keys CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.worship_collections CASCADE;
DROP TABLE IF EXISTS public.song_picks CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('user', 'pastor', 'collaborator', 'admin', 'publisher');

-- 2. Create Users Table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 3. Create Songs Table
CREATE TABLE public.songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT,
  category TEXT DEFAULT 'Worship',
  versions TEXT[] DEFAULT '{}',
  keys TEXT[] DEFAULT '{}',
  pdf_url TEXT NOT NULL,
  lyrics TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_by UUID REFERENCES public.users(id),
  approval_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read songs" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Users can insert songs" ON public.songs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own songs or admins can update any" 
  ON public.songs FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users can delete their own songs or admins can delete any" 
  ON public.songs FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Create Favourites Table
CREATE TABLE public.favourites (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, song_id)
);

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own favourites" ON public.favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favourites" ON public.favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favourites" ON public.favourites FOR DELETE USING (auth.uid() = user_id);

-- 5. Trigger for New User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
BEGIN
  IF new.email = 'khiemvinhtran1112@gmail.com' THEN
    v_role := 'admin'::user_role;
  ELSE
    v_role := 'user'::user_role;
  END IF;

  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    v_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Setup Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('music-sheets', 'music-sheets', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  allowed_mime_types = ARRAY['application/pdf'];

-- Storage Policies
-- Drop existing first to be safe
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'music-sheets');
CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'music-sheets' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own PDFs" ON storage.objects FOR UPDATE USING (bucket_id = 'music-sheets' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own PDFs" ON storage.objects FOR DELETE USING (bucket_id = 'music-sheets' AND auth.uid() = owner);
