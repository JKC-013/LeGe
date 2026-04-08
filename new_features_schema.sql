-- New tables for Worship Submission and tracking features

-- WORSHIP COLLECTIONS TABLE - for Sunday worship song submissions (shopping cart)
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

-- SONG PICKS TRACKING TABLE - track when songs are picked/approved for worship
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
