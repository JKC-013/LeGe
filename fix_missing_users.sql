-- Run this in Supabase SQL editor to add thumbnail_url to songs
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Replace the trigger function to fix the search_path issue
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    CASE 
      WHEN new.email = 'khiemvinhtran1112@gmail.com' THEN 'admin'::public.user_role 
      ELSE 'user'::public.user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix any missing users from failed trigger
INSERT INTO public.users (id, email, name, role)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'name',
  (CASE WHEN email = 'khiemvinhtran1112@gmail.com' THEN 'admin' ELSE 'user' END)::public.user_role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
