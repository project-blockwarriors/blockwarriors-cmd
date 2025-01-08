-- Create function to handle team disbanding in a transaction
create or replace function public.disband_team(team_id_param bigint, leader_id_param uuid)
returns void
language plpgsql
security definer
as $$
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
$$;
