-- This script updates the Row-Level Security (RLS) policies to make stats data
-- publicly readable, which is necessary for the shareable links feature.
-- It only modifies the SELECT (read) policies, leaving the existing
-- INSERT, UPDATE, and DELETE policies for team owners intact.

-- Drop the old, restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their own teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view seasons for their teams" ON public.seasons;
DROP POLICY IF EXISTS "Users can view players for their teams" ON public.players;
DROP POLICY IF EXISTS "Users can view results for their teams" ON public.results;

-- Create new policies that allow public read access for everyone
CREATE POLICY "Teams are publicly viewable" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Seasons are publicly viewable" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Players are publicly viewable" ON public.players FOR SELECT USING (true);
CREATE POLICY "Results are publicly viewable" ON public.results FOR SELECT USING (true);
