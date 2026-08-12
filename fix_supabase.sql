-- 1. Fix the trigger function to have the correct search_path
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    (CASE 
      WHEN new.email = 'khiemvinhtran1112@gmail.com' THEN 'admin' 
      ELSE 'user' 
    END)::public.user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Add thumbnail_url to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 3. Fix any users who signed up but got an error because of the broken trigger
INSERT INTO public.users (id, email, name, role)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'name',
  (CASE WHEN email = 'khiemvinhtran1112@gmail.com' THEN 'admin' ELSE 'user' END)::public.user_role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
