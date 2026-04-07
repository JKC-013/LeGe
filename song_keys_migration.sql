-- 1. Add pdf_url column to song_keys to store key-specific sheet music
ALTER TABLE public.song_keys 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 2. Update existing policies for song_keys to handle the new column (Insert/Select already covered by * but explicit checks are safer)
-- Policies for song_keys already exist but we ensure publishers and admins can Manage these PDFs
-- (Already handled by standard public.get_user_role() policies from previous fix)
