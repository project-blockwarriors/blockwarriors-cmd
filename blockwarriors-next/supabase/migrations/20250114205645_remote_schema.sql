drop function if exists "public"."get_all_teams_with_members"();
alter table "public"."active_tokens" add column "expires_at" timestamp with time zone default (now() + '00:05:00'::interval);
alter table "public"."matches" add column "mode" text default ''::text;
alter table "public"."teams" add column "team_elo" integer not null default 0;
alter table "public"."teams" add column "team_losses" integer not null default 0;
alter table "public"."teams" add column "team_wins" integer not null default 0;
set check_function_bodies = off;
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
          'last_name', u.last_name
        )
      ) FILTER (WHERE u.first_name IS NOT NULL),
      '[]'::jsonb
    ) as members
  FROM teams t
  LEFT JOIN users u ON u.team_id = t.id
  GROUP BY t.id, t.team_name, t.leader_id;
END;
$function$;
