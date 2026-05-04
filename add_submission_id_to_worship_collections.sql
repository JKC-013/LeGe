-- Migration: Add submission_id to worship_collections for batching songs
-- This allows tracking multiple songs submitted together as a single submission

ALTER TABLE public.worship_collections
ADD COLUMN submission_id TEXT;

-- Create index for efficient grouping queries
CREATE INDEX idx_worship_collections_submission_id 
ON public.worship_collections(submission_id);

-- Comment for documentation
COMMENT ON COLUMN public.worship_collections.submission_id IS 'Groups multiple songs submitted together into a single submission batch';
