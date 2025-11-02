import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user profile by userId
export const getUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    return profile;
  },
});

// Check if profile is complete (exists and has teamId)
export const isProfileComplete = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!profile) {
      return false;
    }
    
    // Profile is complete if it has all required fields and a teamId
    return (
      profile.firstName !== null &&
      profile.lastName !== null &&
      profile.teamId !== null
    );
  },
});

// Get all team members by teamId
export const getTeamMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("userProfiles")
      .withIndex("teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
    return members;
  },
});

// Create or update user profile
export const createOrUpdateProfile = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    institution: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        institution: args.institution,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new profile
      return await ctx.db.insert("userProfiles", {
        userId: args.userId,
        firstName: args.firstName,
        lastName: args.lastName,
        institution: args.institution,
        teamId: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Auto-create profile from Better Auth user name (useful for OAuth users)
// This can be called after user creation to automatically populate profile
export const createProfileFromAuthUser = mutation({
  args: {
    userId: v.string(),
    fullName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Parse name into first and last name
    const nameParts = args.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create new profile with parsed name
    const now = Date.now();
    return await ctx.db.insert("userProfiles", {
      userId: args.userId,
      firstName,
      lastName,
      institution: null,
      teamId: null,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Set user's teamId
export const setUserTeam = mutation({
  args: {
    userId: v.string(),
    teamId: v.union(v.id("teams"), v.null()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(profile._id, {
      teamId: args.teamId,
      updatedAt: Date.now(),
    });
  },
});

