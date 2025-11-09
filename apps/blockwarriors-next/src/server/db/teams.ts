import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';
import { TeamWithUsers, Team } from '@/types/team';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { revalidatePath } from 'next/cache';

export async function getAllTeamsWithMembers(): Promise<TeamWithUsers[]> {
  try {
    const token = await getToken();
    if (!token) {
      console.error('No auth token available');
      return [];
    }

    const teams = await fetchQuery(
      api.teams.getAllTeamsWithMembers,
      {},
      { token }
    );

    return teams;
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }
}

export async function createTeam(
  teamName: string,
  leaderId: string
): Promise<{ data: Team | null; error: string | null }> {
  try {
    const token = await getToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    const team = await fetchMutation(
      api.teams.createTeam,
      {
        teamName,
        leaderId,
      },
      { token }
    );

    // Revalidate dashboard layout to update sidebar with new team
    revalidatePath('/dashboard', 'layout');

    return { data: team, error: null };
  } catch (error) {
    return {
      data: null,
      error: (error as Error).message,
    };
  }
}

export async function updateUserTeam(
  userId: string,
  teamId: Id<'teams'> | null
): Promise<{ error: string | null }> {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    await fetchMutation(
      api.teams.updateUserTeam,
      {
        userId,
        teamId,
      },
      { token }
    );

    // Revalidate dashboard layout to update sidebar with team changes
    revalidatePath('/dashboard', 'layout');

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function disbandTeam(
  teamId: Id<'teams'>,
  leaderId: string
): Promise<{ error: string | null }> {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    await fetchMutation(
      api.teams.disbandTeam,
      {
        teamId,
        leaderId,
      },
      { token }
    );

    // Revalidate dashboard layout to update sidebar after team disband
    revalidatePath('/dashboard', 'layout');

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

// Statistics data about teams
export async function getTeamElo(
  teamId: Id<'teams'>
): Promise<{ data?: number; error?: string | null }> {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    const elo = await fetchQuery(
      api.teams.getTeamElo,
      { teamId },
      { token }
    );

    if (elo === null) {
      return { error: 'Team not found' };
    }

    return { data: elo, error: null };
  } catch (error) {
    console.error('Failed to fetch team elo:', error);
    return { error: (error as Error).message };
  }
}

export async function getAllTeamsScores(): Promise<{ data?: Team[]; error?: string | null }> {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    const teams = await fetchQuery(
      api.teams.getAllTeamsScores,
      {},
      { token }
    );

    return { data: teams, error: null };
  } catch (error) {
    console.error('Failed to fetch teams scores:', error);
    return { error: (error as Error).message };
  }
}
