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
