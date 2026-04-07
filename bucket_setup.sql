-- Enable storage extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the music-sheets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music-sheets', 'music-sheets', true)
ON CONFLICT (id) DO NOTHING;

-- Force the bucket to be public in case it was created manually as private
UPDATE storage.buckets SET public = true WHERE id = 'music-sheets';

-- 2. Drop existing policies just in case
DROP POLICY IF EXISTS "Anyone can view music-sheets" ON storage.objects;
DROP POLICY IF EXISTS "Publishers and Admins can upload to music-sheets" ON storage.objects;

-- 3. Policy to read (Anyone can download PDFs)
CREATE POLICY "Anyone can view music-sheets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'music-sheets');

-- 4. Policy to insert (Authenticated Publishers and Admins can upload PDFs)
CREATE POLICY "Publishers and Admins can upload to music-sheets" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'music-sheets' AND 
  public.get_user_role() IN ('publisher', 'admin')
);
