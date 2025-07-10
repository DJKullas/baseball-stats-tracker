-- This script updates the Row-Level Security (RLS) policy on the 'games' table
-- to make game data publicly readable, which is necessary for the shareable links feature.

-- Drop the old, restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view games for their own teams" ON public.games;

-- Create a new policy that allows public read access for everyone
CREATE POLICY "Games are publicly viewable" ON public.games FOR SELECT USING (true);
