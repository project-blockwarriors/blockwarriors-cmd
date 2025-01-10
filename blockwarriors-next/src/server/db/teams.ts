import { createSupabaseClient } from '@/auth/server';
import { Team, TeamWithUsers } from '@/types/team';

interface TeamMember {
  first_name: string;
  last_name: string;
}

export async function getAllTeamsWithMembers(): Promise<TeamWithUsers[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.rpc('get_all_teams_with_members');

  if (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }

  return data;
}

export async function createTeam(
  teamName: string,
  leaderId: string
): Promise<{ data: Team | null; error: string | null }> {
  const supabase = await createSupabaseClient();

  // First check if user is already in a team
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('team_id')
    .eq('user_id', leaderId)
    .single();

  if (userError) {
    return {
      data: null,
      error: `Failed to check user team status: ${userError.message}`,
    };
  }

  if (user.team_id) {
    return { data: null, error: 'You are already a member of a team' };
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
    return {
      data: null,
      error: `Failed to create team: ${createError.message}`,
    };
  }

  // Update the user's team_id
  const { error: updateError } = await supabase
    .from('users')
    .update({ team_id: team.id })
    .eq('user_id', leaderId);

  if (updateError) {
    // If updating user fails, clean up by deleting the created team
    await supabase.from('teams').delete().eq('id', team.id);
    return {
      data: null,
      error: `Failed to join created team: ${updateError.message}`,
    };
  }

  return { data: team, error: null };
}

export async function updateUserTeam(userId: string, teamId: number | null) {
  const supabase = await createSupabaseClient();
  return await supabase
    .from('users')
    .update({ team_id: teamId })
    .eq('user_id', userId);
}

export async function disbandTeam(
  teamId: number,
  leaderId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient();

  // First, verify that the user is the team leader
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single();

  if (teamError) {
    return { error: `Failed to verify team leadership: ${teamError.message}` };
  }

  if (team.leader_id !== leaderId) {
    return { error: 'Only the team leader can disband the team' };
  }

  // Disband the team via a transaction
  const { error: deleteError } = await supabase.rpc('disband_team', {
    team_id_param: teamId,
    leader_id_param: leaderId,
  });

  if (deleteError) {
    return { error: `Failed to disband team: ${deleteError.message}` };
  }

  return { error: null };
}

// Statistics data about teams
export async function getTeamElo(teamId: number): Promise<{ data?: number; error?: string | null }> {
  const supabase = await createSupabaseClient();
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('team_elo')
    .eq('id', teamId)
    .single();

  if (teamError) {
    console.error('Failed to fetch team elo:', teamError);
    return { error: teamError.message };
  }

  return { data: team.team_elo, error: null };
}

export async function getAllTeamsScores(): Promise<{ data?: Team[]; error?: string | null }> {
  const supabase = await createSupabaseClient();
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, team_name, leader_id, team_elo, team_wins, team_losses')
    .order('team_elo', { ascending: false });

  if (teamsError) {
    console.error('Failed to fetch teams scores:', teamsError);
    return { error: teamsError.message };
  }

  return { data: teams, error: null };
}
