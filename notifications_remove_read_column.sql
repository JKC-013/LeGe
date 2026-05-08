-- Migration: Remove read column and obsolete read index from notifications table
-- Run this in Supabase SQL editor to update existing databases
-- This removes the unused read/unread feature from notifications

ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;
DROP INDEX IF EXISTS public.idx_notifications_read;

-- Add delete policy so users can clear their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can delete own notifications'
      AND polrelid = 'public.notifications'::regclass
  ) THEN
    CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
