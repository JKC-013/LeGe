-- New tables for collections and tracking features

-- COLLECTIONS TABLE - for users to save songs to their personal collection
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- WORSHIP COLLECTIONS TABLE - for Sunday worship submissions
CREATE TABLE IF NOT EXISTS public.worship_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status content_status DEFAULT 'pending'::content_status NOT NULL,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, song_id, submitted_at)
);

ALTER TABLE public.worship_collections ENABLE ROW LEVEL SECURITY;

-- Worship collections policies
CREATE POLICY "Anyone can view approved worship submissions" ON public.worship_collections FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own worship submissions" ON public.worship_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all worship submissions" ON public.worship_collections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can submit worship songs" ON public.worship_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update worship submissions" ON public.worship_collections FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- SONG PICKS TRACKING TABLE - track when songs are picked for worship
CREATE TABLE IF NOT EXISTS public.song_picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  picked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.song_picks ENABLE ROW LEVEL SECURITY;

-- Song picks policies  
CREATE POLICY "Anyone can view picks data" ON public.song_picks FOR SELECT USING (true);
CREATE POLICY "Admins can insert picks" ON public.song_picks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Update song_keys table to support 'band' audience as well
-- This is already supported through the songs audience field, no changes needed to song_keys
