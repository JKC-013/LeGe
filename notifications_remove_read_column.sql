-- Migration: Remove read column from notifications table
-- Run this in Supabase SQL editor to update existing databases
-- This removes the unused read/unread feature from notifications

ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;
