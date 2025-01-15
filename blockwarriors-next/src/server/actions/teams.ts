'use server';

import { TeamWithUsers, Team } from '@/types/team';
import {
  getAllTeamsWithMembers as getAllTeamsWithMembersDb,
  createTeam as createTeamDb,
  updateUserTeam,
  disbandTeam as disbandTeamDb,
  getAllTeamsScores,
} from '../db/teams';

export async function getTeams(): Promise<TeamWithUsers[]> {
  return await getAllTeamsWithMembersDb();
}

export async function createTeam(
  teamName: string,
  leaderId: string
): Promise<{ data: Team | null; error: string | null }> {
  return await createTeamDb(teamName, leaderId);
}

export async function joinTeam(
  teamId: number,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await updateUserTeam(userId, teamId);
  return { error: error?.message || null };
}

export async function leaveTeam(userId: string): Promise<{ error: string | null }> {
  console.log('Initiating leaveTeam for userId:', userId);

  // Call `updateUserTeam` and capture its results
  const { data, error } = await updateUserTeam(userId, null);

  if (error) {
    console.error('Error in leaveTeam:', error); // Log the full error object
    return { error: error.message || 'Unknown error occurred' }; // Return the error message
  }

  console.log('Successfully updated user team. Data returned:', data);
  return { error: null }; // No errors
}

export async function disbandTeam(
  teamId: number,
  leaderId: string
): Promise<{ error: string | null }> {
  return await disbandTeamDb(teamId, leaderId);
}

export async function getTeamLeaderboard(): Promise<{ data?: Team[]; error?: string | null }> {
  return await getAllTeamsScores();
}
