-- Database setup for worship submission and notification features
-- Run this in Supabase SQL editor or psql to create the required tables and policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE IF NOT EXISTS user_role AS ENUM ('user', 'publisher', 'admin');
CREATE TYPE IF NOT EXISTS content_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE IF NOT EXISTS audience_type AS ENUM ('band', 'worship');

-- Worship submission batch table
CREATE TABLE IF NOT EXISTS public.worship_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status content_status DEFAULT 'pending'::content_status NOT NULL,
  message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.worship_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own worship submissions" ON public.worship_submissions FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can view all worship submissions" ON public.worship_submissions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Users can create worship submissions" ON public.worship_submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can update worship submissions" ON public.worship_submissions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Link worship_collections rows to a submission batch
ALTER TABLE public.worship_collections 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.worship_submissions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_worship_collections_submission_id 
ON public.worship_collections(submission_id);

CREATE INDEX IF NOT EXISTS idx_worship_submissions_status 
ON public.worship_submissions(status);

CREATE INDEX IF NOT EXISTS idx_worship_submissions_user_id 
ON public.worship_submissions(user_id);

-- Notification table for user inbox messages
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own notifications" ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "System can insert notifications" ON public.notifications FOR INSERT 
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON public.notifications(read);
