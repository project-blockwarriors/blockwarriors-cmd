-- Create a function to get all teams with their members
CREATE OR REPLACE FUNCTION get_all_teams_with_members()
RETURNS TABLE (
  id INT,
  team_name TEXT,
  leader_id UUID,
  members JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.team_name,
    t.leader_id,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'first_name', u.first_name,
          'last_name', u.last_name
        )
      ) FILTER (WHERE u.first_name IS NOT NULL),
      '[]'::jsonb
    ) as members
  FROM teams t
  LEFT JOIN users u ON u.team_id = t.id
  GROUP BY t.id, t.team_name, t.leader_id;
END;
$$;
