-- Create worship_submissions table to track submission batches
-- This separates submission identity from individual song entries

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

-- Worship submissions policies
CREATE POLICY "Users can view own worship submissions" ON public.worship_submissions FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all worship submissions" ON public.worship_submissions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can create worship submissions" ON public.worship_submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update worship submissions" ON public.worship_submissions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Add submission_id to worship_collections to link songs to submission batch
ALTER TABLE public.worship_collections 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.worship_submissions(id) ON DELETE CASCADE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_worship_collections_submission_id 
ON public.worship_collections(submission_id);

CREATE INDEX IF NOT EXISTS idx_worship_submissions_status 
ON public.worship_submissions(status);

CREATE INDEX idx_worship_submissions_user_id 
ON public.worship_submissions(user_id);

-- Notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- e.g., 'worship_approved', 'worship_rejected', 'song_approved', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data like submission_id, song_id, etc.
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT 
  WITH CHECK (true); -- Allow inserts from service role

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON public.notifications(read);
