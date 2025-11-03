import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Helper function to split full name into first and last name
// Takes first word as first name, last word as last name (handles middle names)
function splitName(fullName: string | null | undefined): { firstName: string | null; lastName: string | null } {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: null, lastName: null };
  }
  
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    return { firstName: null, lastName: null };
  } else if (nameParts.length === 1) {
    // Only one name provided - use it as first name
    return { firstName: nameParts[0], lastName: null };
  } else {
    // First word is first name, last word is last name
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return { firstName, lastName };
  }
}

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

// Initialize user profile from Google OAuth data (name, email, etc.)
// This should be called when a user first signs up to prefill their profile
export const initializeUserProfile = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Profile already exists, don't overwrite
      return { success: true, alreadyExists: true };
    }

    // Get user data from BetterAuth to extract name
    const authUser = await authComponent.getAuthUser(ctx);
    
    const now = Date.now();
    
    // Extract name from BetterAuth user data
    let firstName: string | null = null;
    let lastName: string | null = null;
    
    if (authUser?.name) {
      const nameParts = splitName(authUser.name);
      firstName = nameParts.firstName;
      lastName = nameParts.lastName;
    }

    // Create new profile with prefilled name data from Google OAuth
    await ctx.db.insert("userProfiles", {
      userId: args.userId,
      firstName: firstName,
      lastName: lastName,
      institution: null,
      geographicLocation: null,
      teamId: null,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, alreadyExists: false };
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

