-- Migration: Add worship_date column to worship_submissions table
-- Run this in Supabase SQL editor to update existing databases
-- This adds the optional worship date field for cart submissions

ALTER TABLE public.worship_submissions ADD COLUMN IF NOT EXISTS worship_date DATE;