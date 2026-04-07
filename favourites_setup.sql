-- 1. Create the favourites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.favourites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, song_id)
);

-- 2. Enable RLS
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can insert their own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can delete their own favourites" ON public.favourites;

-- 4. Recreate policies
CREATE POLICY "Users can view their own favourites" 
ON public.favourites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favourites" 
ON public.favourites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favourites" 
ON public.favourites FOR DELETE 
USING (auth.uid() = user_id);
