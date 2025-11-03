'use server';

import { TeamWithUsers, Team } from '@/types/team';
import {
  getAllTeamsWithMembers as getAllTeamsWithMembersDb,
  createTeam as createTeamDb,
  updateUserTeam,
  disbandTeam as disbandTeamDb,
  getAllTeamsScores,
} from '../db/teams';
import { Id } from '../../../../convex/_generated/dataModel';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getToken } from '@/lib/auth-server';

export async function getTeams(): Promise<TeamWithUsers[]> {
  return await getAllTeamsWithMembersDb();
}

export async function createTeam(
  teamName: string,
  timeZone: string,
  leaderId: string
): Promise<{ data: Team | null; error: string | null }> {
  return await createTeamDb(teamName, timeZone, leaderId);
}

export async function joinTeam(
  teamId: Id<'teams'>,
  userId: string
): Promise<{ error: string | null }> {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    await fetchMutation(
      api.teams.joinTeam,
      { teamId, userId },
      { token }
    );

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function leaveTeam(
  userId: string
): Promise<{ error: string | null }> {
  try {
    const token = await getToken();
    if (!token) {
      return { error: 'Not authenticated' };
    }

    await fetchMutation(
      api.teams.leaveTeam,
      { userId },
      { token }
    );

    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function disbandTeam(
  teamId: Id<'teams'>,
  leaderId: string
): Promise<{ error: string | null }> {
  return await disbandTeamDb(teamId, leaderId);
}

export async function getTeamLeaderboard(): Promise<{ data?: Team[]; error?: string | null }> {
  return await getAllTeamsScores();
}
