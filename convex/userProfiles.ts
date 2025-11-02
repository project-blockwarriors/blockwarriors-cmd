import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user profile by userId
export const getUserProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return null;
    }

    // Get team data from Convex if teamId exists
    let team = null;
    if (profile.teamId) {
      const teamData = await ctx.db.get(profile.teamId);
      if (teamData) {
        team = {
          id: teamData._id,
          team_name: teamData.teamName,
          leader_id: teamData.leaderId,
          team_elo: teamData.teamElo,
          team_wins: teamData.teamWins,
          team_losses: teamData.teamLosses,
          time_zone: teamData.timeZone,
        };
      }
    }

    return {
      user_id: profile.userId,
      first_name: profile.firstName,
      last_name: profile.lastName,
      institution: profile.institution,
      geographic_location: profile.geographicLocation,
      team: team,
    };
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.string(),
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    institution: v.union(v.string(), v.null()),
    geographicLocation: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        institution: args.institution,
        geographicLocation: args.geographicLocation,
        updatedAt: now,
      });
      return { success: true };
    } else {
      // Create new profile
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        firstName: args.firstName,
        lastName: args.lastName,
        institution: args.institution,
        geographicLocation: args.geographicLocation,
        teamId: null,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }
  },
});

