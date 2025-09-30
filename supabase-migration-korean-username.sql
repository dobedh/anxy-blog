-- Migration: Allow Korean characters in usernames and set minimum length to 2
-- Date: 2025-09-30
-- Description: Update username constraints to support Korean characters (가-힣) and 2-character minimum

-- Drop existing constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS username_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS username_format;

-- Add new constraints that allow Korean characters and 2-character minimum
ALTER TABLE profiles ADD CONSTRAINT username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 20);
ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_가-힣]+$');

-- Verify the constraints were added
SELECT
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
    AND conname IN ('username_length', 'username_format');