"use server";

import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/lib/convex";
import { getToken } from "@/lib/auth-server";
import type { Id } from "../../../../convex/_generated/dataModel";

// Get team details
export async function getTeamDetails(teamId: Id<"teams">) {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const team = await fetchQuery(
      api.teams.getTeam,
      { teamId },
      { token }
    );

    return team;
  } catch (error) {
    console.error("Error getting team details:", error);
    throw error;
  }
}

// Get available teams user can join
export async function getAvailableTeams(userId: string) {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error("Invalid userId provided");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const teams = await fetchQuery(
      api.teams.getAvailableTeams,
      { userId },
      { token }
    );

    return teams;
  } catch (error) {
    console.error("Error getting available teams:", error);
    throw error;
  }
}

// Create a team
export async function createTeam(leaderId: string, teamName: string): Promise<Id<"teams">> {
  try {
    if (!leaderId || typeof leaderId !== 'string') {
      throw new Error("Invalid leaderId provided");
    }

    if (!teamName || typeof teamName !== 'string') {
      throw new Error("Invalid teamName provided");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const teamId = await fetchMutation(
      api.teams.createTeam,
      {
        leaderId,
        teamName,
      },
      { token }
    );

    return teamId;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

// Join a team
export async function joinTeam(userId: string, teamId: Id<"teams">): Promise<void> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error("Invalid userId provided");
    }

    if (!teamId) {
      throw new Error("Invalid teamId provided");
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    await fetchMutation(
      api.teams.joinTeam,
      {
        userId,
        teamId,
      },
      { token }
    );
  } catch (error) {
    console.error("Error joining team:", error);
    throw error;
  }
}

// Helper function: Get all teams with their members
// Note: Currently not used - teams page uses server-side rendering directly
// Kept for potential client component usage
export async function getAllTeamsWithMembers() {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    // Get all teams
    const teams = await fetchQuery(
      api.teams.getAllTeams,
      {},
      { token }
    );

    // For each team, get members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await fetchQuery(
          api.userProfiles.getTeamMembers,
          { teamId: team._id },
          { token }
        );
        return {
          id: team._id,
          team_name: team.teamName,
          leader_id: team.leaderId,
          members: members.map((m) => ({
            user_id: m.userId,
            first_name: m.firstName,
            last_name: m.lastName,
            institution: m.institution,
          })),
        };
      })
    );

    return teamsWithMembers;
  } catch (error) {
    console.error("Error getting teams with members:", error);
    throw error;
  }
}

