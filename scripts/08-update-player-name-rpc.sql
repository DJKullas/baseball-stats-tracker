-- Create RPC function to update player name with proper permissions
CREATE OR REPLACE FUNCTION update_player_name(
  p_team_id UUID,
  p_player_id UUID,
  p_new_name TEXT
)
RETURNS TABLE(
  id UUID,
  team_id UUID,
  name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if the user owns the team
  IF NOT EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = p_team_id 
    AND teams.user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not own this team';
  END IF;
  
  -- Update the player name
  UPDATE players 
  SET name = p_new_name 
  WHERE players.id = p_player_id 
  AND players.team_id = p_team_id;
  
  -- Return the updated player
  RETURN QUERY
  SELECT players.id, players.team_id, players.name, players.created_at
  FROM players
  WHERE players.id = p_player_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_player_name(UUID, UUID, TEXT) TO authenticated;
