-- Step 1: Create the new 'games' table to uniquely identify each game
CREATE TABLE public.games (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL,
    season_id uuid NOT NULL,
    game_date date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT games_pkey PRIMARY KEY (id),
    CONSTRAINT games_season_id_fkey FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    CONSTRAINT games_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Step 2: Add Row-Level Security (RLS) to the new 'games' table
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view games for their own teams"
ON public.games FOR SELECT
USING (auth.uid() = (SELECT user_id FROM teams WHERE id = team_id));

CREATE POLICY "Users can insert games for their own teams"
ON public.games FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM teams WHERE id = team_id));

CREATE POLICY "Users can update games for their own teams"
ON public.games FOR UPDATE
USING (auth.uid() = (SELECT user_id FROM teams WHERE id = team_id));

CREATE POLICY "Users can delete games for their own teams"
ON public.games FOR DELETE
USING (auth.uid() = (SELECT user_id FROM teams WHERE id = team_id));

-- Step 3: Add game_id to results table, making it nullable temporarily for migration
ALTER TABLE public.results ADD COLUMN game_id uuid;

-- Step 4: Migrate existing data into the new structure
-- Create a temporary table to map old (date, season) pairs to new unique game IDs
CREATE TEMP TABLE game_mapping AS
SELECT
    s.team_id,
    r.season_id,
    r.game_date,
    gen_random_uuid() as new_game_id
FROM
    results r
JOIN
    seasons s ON r.season_id = s.id
GROUP BY
    s.team_id, r.season_id, r.game_date;

-- Populate the new 'games' table from the temporary mapping
INSERT INTO public.games (id, team_id, season_id, game_date)
SELECT new_game_id, team_id, season_id, game_date FROM game_mapping;

-- Update the results table to link each result to its new unique game
UPDATE public.results r
SET game_id = gm.new_game_id
FROM game_mapping gm
WHERE r.season_id = gm.season_id AND r.game_date = gm.game_date;

-- Clean up the temporary table
DROP TABLE game_mapping;

-- Step 5: Finalize the 'results' table schema
-- Make game_id non-nullable as the migration is complete
ALTER TABLE public.results ALTER COLUMN game_id SET NOT NULL;

-- Add the foreign key constraint, ensuring that deleting a game also deletes its results
ALTER TABLE public.results
ADD CONSTRAINT results_game_id_fkey
FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;

-- Remove the old, redundant columns from the results table
ALTER TABLE public.results DROP COLUMN game_date;
ALTER TABLE public.results DROP COLUMN season_id;

-- Step 6: Update RLS on the 'results' table to check ownership via the new 'games' table
-- Drop old policies that are now invalid
DROP POLICY IF EXISTS "Users can view results for their own teams" ON public.results;
DROP POLICY IF EXISTS "Users can insert results for their own teams" ON public.results;
DROP POLICY IF EXISTS "Users can update results for their own teams" ON public.results;
DROP POLICY IF EXISTS "Users can delete results for their own teams" ON public.results;

-- Create new policies that check ownership through the 'games' table link
CREATE POLICY "Users can view results for games of their teams"
ON public.results FOR SELECT
USING (EXISTS (SELECT 1 FROM games g JOIN teams t ON g.team_id = t.id WHERE g.id = results.game_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can insert results for games of their teams"
ON public.results FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM games g JOIN teams t ON g.team_id = t.id WHERE g.id = results.game_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can update results for games of their teams"
ON public.results FOR UPDATE
USING (EXISTS (SELECT 1 FROM games g JOIN teams t ON g.team_id = t.id WHERE g.id = results.game_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can delete results for games of their teams"
ON public.results FOR DELETE
USING (EXISTS (SELECT 1 FROM games g JOIN teams t ON g.team_id = t.id WHERE g.id = results.game_id AND t.user_id = auth.uid()));
