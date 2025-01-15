CREATE OR REPLACE FUNCTION public.get_all_teams_with_members()
 RETURNS TABLE(id integer, team_name text, leader_id uuid, team_elo integer, team_wins integer, team_losses integer, members jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.team_name,
    t.leader_id,
    t.team_elo,
    t.team_wins,
    t.team_losses,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'first_name', u.first_name,
          'last_name', u.last_name,
          'user_id', u.user_id
        )
      ) FILTER (WHERE u.first_name IS NOT NULL),
      '[]'::jsonb
    ) as members
  FROM teams t
  LEFT JOIN users u ON u.team_id = t.id
  GROUP BY t.id, t.team_name, t.leader_id;
END;
$function$;
