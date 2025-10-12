-- Migration: Remove display_name column from profiles table
-- Run this in Supabase SQL Editor
-- Date: 2025-10-12

-- Drop display_name column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS display_name;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
