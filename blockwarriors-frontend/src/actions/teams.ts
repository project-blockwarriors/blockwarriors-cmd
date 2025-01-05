'use server';

import { createSupabaseClient } from '@/auth/server';
import { Team } from '@/types/team';

interface TeamMember {
  first_name: string;
  last_name: string;
}

interface TeamWithUsers extends Team {
  members: TeamMember[];
}

export async function getTeams(): Promise<TeamWithUsers[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = (await supabase.rpc(
    'get_all_teams_with_members'
  )) as { data: TeamWithUsers[]; error: any };

  if (error) {
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }

  return data;
}

export async function createTeam(
  teamName: string,
  leaderId: string
): Promise<Team> {
  const supabase = await createSupabaseClient();

  // First check if user is already in a team
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('team_id')
    .eq('user_id', leaderId)
    .single();

  if (userError) {
    throw new Error(`Failed to check user team status: ${userError.message}`);
  }

  if (user.team_id) {
    throw new Error('You are already a member of a team');
  }

  // Create the team
  const { data: team, error: createError } = await supabase
    .from('teams')
    .insert([
      {
        team_name: teamName,
        leader_id: leaderId,
      },
    ])
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create team: ${createError.message}`);
  }

  // Update the user's team_id
  const { error: updateError } = await supabase
    .from('users')
    .update({ team_id: team.id })
    .eq('user_id', leaderId);

  if (updateError) {
    // If updating user fails, clean up by deleting the created team
    await supabase.from('teams').delete().eq('id', team.id);
    throw new Error(`Failed to join created team: ${updateError.message}`);
  }

  return team;
}

export async function joinTeam(teamId: number, userId: string): Promise<void> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ team_id: teamId })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to join team: ${error.message}`);
  }
}

export async function leaveTeam(userId: string): Promise<void> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ team_id: null })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to leave team: ${error.message}`);
  }
}

export async function disbandTeam(
  teamId: number,
  leaderId: string
): Promise<void> {
  const supabase = await createSupabaseClient();

  // First, verify that the user is the team leader
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single();

  if (teamError) {
    throw new Error(`Failed to verify team leadership: ${teamError.message}`);
  }

  if (team.leader_id !== leaderId) {
    throw new Error('Only the team leader can disband the team');
  }

  // Start a transaction by wrapping operations
  const { error: deleteError } = await supabase.rpc('disband_team', {
    team_id_param: teamId,
    leader_id_param: leaderId,
  });

  if (deleteError) {
    throw new Error(`Failed to disband team: ${deleteError.message}`);
  }
}
