set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.disband_team(team_id_param bigint, leader_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Verify the user is still the team leader
  if not exists (
    select 1 from public.teams 
    where id = team_id_param 
    and leader_id = leader_id_param
  ) then
    raise exception 'Only the team leader can disband the team';
  end if;

  -- Start transaction
  begin
    -- Remove team_id from all team members
    update public.users
    set team_id = null
    where team_id = team_id_param;

    -- Delete the team
    delete from public.teams
    where id = team_id_param;

    -- If any of the above fails, the entire transaction will be rolled back
  end;
end;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    INSERT INTO public.users (
        user_id,
        first_name,
        last_name,
        email
    ) VALUES (
        new.id,
        COALESCE(split_part(jsonb_extract_path_text(new.raw_user_meta_data, 'full_name'), ' ', 1), NULL),
        COALESCE(split_part(jsonb_extract_path_text(new.raw_user_meta_data, 'full_name'), ' ', 2), NULL),
        new.email
    );
    RETURN new;
END;
$function$
;


