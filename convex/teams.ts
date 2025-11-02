import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all teams
export const getAllTeams = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teams").collect();
  },
});

// Get team by id
export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

// Get count of members in a team
export const getTeamCount = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("userProfiles")
      .withIndex("teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
    return members.length;
  },
});

// Get available teams user can join (excluding their current team, and teams with < 4 members)
export const getAvailableTeams = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get user's current team
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const currentTeamId = userProfile?.teamId;

    // Get all teams
    const allTeams = await ctx.db.query("teams").collect();

    // Filter and check team sizes
    const availableTeams = [];
    for (const team of allTeams) {
      // Skip user's current team
      if (currentTeamId && team._id === currentTeamId) {
        continue;
      }

      // Get member count
      const memberCount = await ctx.db
        .query("userProfiles")
        .withIndex("teamId", (q) => q.eq("teamId", team._id))
        .collect();

      // Only include teams with < 4 members
      if (memberCount.length < 4) {
        availableTeams.push({
          ...team,
          memberCount: memberCount.length,
        });
      }
    }

    return availableTeams;
  },
});

// Create a team and set leader's teamId
export const createTeam = mutation({
  args: {
    leaderId: v.string(),
    teamName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if leader already has a profile
    const leaderProfile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.leaderId))
      .first();

    if (!leaderProfile) {
      throw new Error("User profile not found. Please complete your profile first.");
    }

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      teamName: args.teamName,
      leaderId: args.leaderId,
      createdAt: now,
      updatedAt: now,
    });

    // Set leader's teamId
    await ctx.db.patch(leaderProfile._id, {
      teamId: teamId,
      updatedAt: now,
    });

    return teamId;
  },
});

// Join a team (updates userProfile.teamId) with validation
export const joinTeam = mutation({
  args: {
    userId: v.string(),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Verify team exists
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Get current member count
    const currentMembers = await ctx.db
      .query("userProfiles")
      .withIndex("teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (currentMembers.length >= 4) {
      throw new Error("Team is full (maximum 4 members)");
    }

    // Get user profile
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found. Please complete your profile first.");
    }

    // Update user's teamId
    await ctx.db.patch(userProfile._id, {
      teamId: args.teamId,
      updatedAt: Date.now(),
    });
  },
});

