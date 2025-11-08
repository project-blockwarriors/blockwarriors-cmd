import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all teams with their members
export const getAllTeamsWithMembers = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        // Get all users in this team
        const members = await ctx.db
          .query("userProfiles")
          .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
          .collect();

        return {
          id: team._id,
          team_name: team.teamName,
          leader_id: team.leaderId,
          team_elo: team.teamElo,
          team_wins: team.teamWins,
          team_losses: team.teamLosses,
          time_zone: team.timeZone,
          description: team.description,
          members: members.map((member) => ({
            user_id: member.userId,
            first_name: member.firstName,
            last_name: member.lastName,
          })),
        };
      })
    );

    return teamsWithMembers;
  },
});

// Get team by ID
export const getTeamById = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }

    const members = await ctx.db
      .query("userProfiles")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    return {
      id: team._id,
      team_name: team.teamName,
      leader_id: team.leaderId,
      team_elo: team.teamElo,
      team_wins: team.teamWins,
      team_losses: team.teamLosses,
      time_zone: team.timeZone,
      description: team.description,
      members: members.map((member) => ({
        user_id: member.userId,
        first_name: member.firstName,
        last_name: member.lastName,
      })),
    };
  },
});

// Get team leaderboard (sorted by ELO)
export const getTeamLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_teamElo")
      .order("desc")
      .collect();

    return teams.map((team) => ({
      id: team._id,
      team_name: team.teamName,
      leader_id: team.leaderId,
      team_elo: team.teamElo,
      team_wins: team.teamWins,
      team_losses: team.teamLosses,
    }));
  },
});

// Create a new team
export const createTeam = mutation({
  args: {
    teamName: v.string(),
    timeZone: v.string(),
    leaderId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is already in a team
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.leaderId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.teamId) {
      throw new Error("You are already a member of a team");
    }

    // Check if team name already exists
    const existingTeam = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("teamName"), args.teamName))
      .first();

    if (existingTeam) {
      throw new Error("Team name already exists");
    }

    const now = Date.now();

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      teamName: args.teamName,
      description: null,
      leaderId: args.leaderId,
      timeZone: args.timeZone,
      teamElo: 0,
      teamWins: 0,
      teamLosses: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update user's teamId
    await ctx.db.patch(userProfile._id, {
      teamId: teamId,
      updatedAt: now,
    });

    const team = await ctx.db.get(teamId);
    if (!team) {
      throw new Error("Failed to create team");
    }

    return {
      id: team._id,
      team_name: team.teamName,
      leader_id: team.leaderId,
      team_elo: team.teamElo,
      team_wins: team.teamWins,
      team_losses: team.teamLosses,
      time_zone: team.timeZone,
    };
  },
});

// Update user's team (join or leave)
export const updateUserTeam = mutation({
  args: {
    userId: v.string(),
    teamId: v.union(v.id("teams"), v.null()),
  },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const now = Date.now();
    await ctx.db.patch(userProfile._id, {
      teamId: args.teamId,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Join a team
export const joinTeam = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify team exists
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is already in a team
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.teamId) {
      throw new Error("You are already a member of a team");
    }

    const now = Date.now();
    await ctx.db.patch(userProfile._id, {
      teamId: args.teamId,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Leave a team
export const leaveTeam = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (!userProfile.teamId) {
      throw new Error("You are not a member of any team");
    }

    const now = Date.now();
    await ctx.db.patch(userProfile._id, {
      teamId: null,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Disband a team (only leader can do this)
export const disbandTeam = mutation({
  args: {
    teamId: v.id("teams"),
    leaderId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify team exists and user is the leader
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.leaderId !== args.leaderId) {
      throw new Error("Only the team leader can disband the team");
    }

    // Get all team members
    const members = await ctx.db
      .query("userProfiles")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    const now = Date.now();

    // Remove team from all members
    await Promise.all(
      members.map((member) =>
        ctx.db.patch(member._id, {
          teamId: null,
          updatedAt: now,
        })
      )
    );

    // Delete the team
    await ctx.db.delete(args.teamId);

    return { success: true };
  },
});

// Get team ELO
export const getTeamElo = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }
    return team.teamElo;
  },
});

// Get all teams scores
export const getAllTeamsScores = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_teamElo")
      .order("desc")
      .collect();

    return teams.map((team) => ({
      id: team._id,
      team_name: team.teamName,
      leader_id: team.leaderId,
      team_elo: team.teamElo,
      team_wins: team.teamWins,
      team_losses: team.teamLosses,
    }));
  },
});


