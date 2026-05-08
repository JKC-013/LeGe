-- Database setup for worship submission and notification features
-- Run this in Supabase SQL editor or psql to create the required tables and policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'publisher', 'admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
    CREATE TYPE content_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audience_type') THEN
    CREATE TYPE audience_type AS ENUM ('band', 'worship');
  END IF;
END
$$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can view own worship submissions'
      AND polrelid = 'public.worship_submissions'::regclass
  ) THEN
    CREATE POLICY "Users can view own worship submissions" ON public.worship_submissions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can view all worship submissions'
      AND polrelid = 'public.worship_submissions'::regclass
  ) THEN
    CREATE POLICY "Admins can view all worship submissions" ON public.worship_submissions FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can create worship submissions'
      AND polrelid = 'public.worship_submissions'::regclass
  ) THEN
    CREATE POLICY "Users can create worship submissions" ON public.worship_submissions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can update worship submissions'
      AND polrelid = 'public.worship_submissions'::regclass
  ) THEN
    CREATE POLICY "Admins can update worship submissions" ON public.worship_submissions FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END
$$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can view own notifications'
      AND polrelid = 'public.notifications'::regclass
  ) THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can update own notifications'
      AND polrelid = 'public.notifications'::regclass
  ) THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'System can insert notifications'
      AND polrelid = 'public.notifications'::regclass
  ) THEN
    CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON public.notifications(read);
