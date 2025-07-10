-- This script adds a 'source' column to the 'games' table to track
-- how a game was created (e.g., 'manual', 'upload', 'sms').

ALTER TABLE public.games
ADD COLUMN source text NOT NULL DEFAULT 'unknown';

-- This command tells Supabase to refresh its schema cache immediately.
NOTIFY pgrst, 'reload schema';
