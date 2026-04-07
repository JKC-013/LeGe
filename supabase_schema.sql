-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'publisher', 'admin');
CREATE TYPE content_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE audience_type AS ENUM ('band', 'worship');

-- USERS TABLE (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SONGS TABLE
CREATE TABLE public.songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  audience audience_type NOT NULL,
  preview_url TEXT,
  pdf_url TEXT NOT NULL,
  lyrics TEXT,
  status content_status DEFAULT 'pending'::content_status NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- SONG KEYS TABLE
CREATE TABLE public.song_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  status content_status DEFAULT 'pending'::content_status NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.song_keys ENABLE ROW LEVEL SECURITY;

-- FAVOURITES TABLE
CREATE TABLE public.favourites (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, song_id)
);

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update roles" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Songs policies
CREATE POLICY "Anyone can view approved songs" ON public.songs FOR SELECT USING (status = 'approved');
CREATE POLICY "Publishers can view their own pending songs" ON public.songs FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins can view all songs" ON public.songs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Publishers and admins can insert songs" ON public.songs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('publisher', 'admin'))
);
CREATE POLICY "Admins can update songs" ON public.songs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete songs" ON public.songs FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Song Keys policies
CREATE POLICY "Anyone can view approved keys" ON public.song_keys FOR SELECT USING (status = 'approved');
CREATE POLICY "Publishers can view their own pending keys" ON public.song_keys FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins can view all keys" ON public.song_keys FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Publishers and admins can insert keys" ON public.song_keys FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('publisher', 'admin'))
);
CREATE POLICY "Admins can update keys" ON public.song_keys FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete keys" ON public.song_keys FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Favourites policies
CREATE POLICY "Users can view their own favourites" ON public.favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favourites" ON public.favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favourites" ON public.favourites FOR DELETE USING (auth.uid() = user_id);

-- TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE 
      WHEN new.email = 'khiemvinhtran1112@gmail.com' THEN 'admin'::user_role 
      ELSE 'user'::user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
