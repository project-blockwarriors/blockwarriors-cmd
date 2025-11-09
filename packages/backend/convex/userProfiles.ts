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
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    if (!profile) {
      return null;
    }

    // Get team data from Convex if team_id exists
    let team = null;
    if (profile.team_id) {
      const teamData = await ctx.db.get(profile.team_id);
      if (teamData) {
        team = {
          id: teamData._id,
          team_name: teamData.team_name,
          leader_id: teamData.leader_id,
          team_elo: teamData.team_elo,
          team_wins: teamData.team_wins,
          team_losses: teamData.team_losses,
        };
      }
    }

    return {
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      institution: profile.institution,
      geographic_location: profile.geographic_location,
      team: team,
    };
  },
});

// Initialize user profile from Google OAuth data (name, email, etc.)
// This should be called when a user first signs up to prefill their profile
// Note: Since all fields are now required, this creates a profile with placeholder values
// that must be filled in by the user during setup
export const initializeUserProfile = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    if (existing) {
      // Profile already exists, don't overwrite
      return { success: true, alreadyExists: true };
    }

    // Get user data from BetterAuth to extract name
    const authUser = await authComponent.getAuthUser(ctx);
    
    const now = Date.now();
    
    // Extract name from BetterAuth user data
    let firstName = "";
    let lastName = "";
    
    if (authUser?.name) {
      const nameParts = splitName(authUser.name);
      firstName = nameParts.firstName || "";
      lastName = nameParts.lastName || "";
    }

    // Create new profile with all required fields
    // Use empty strings as placeholders for fields that must be filled during setup
    await ctx.db.insert("user_profiles", {
      user_id: args.userId,
      first_name: firstName,
      last_name: lastName,
      institution: "", // Must be filled during setup
      geographic_location: "", // Must be filled during setup
      updated_at: now,
    });

    return { success: true, alreadyExists: false };
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    institution: v.string(),
    geographicLocation: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate that all required fields are non-empty
    if (
      !args.firstName?.trim() ||
      !args.lastName?.trim() ||
      !args.institution?.trim() ||
      !args.geographicLocation?.trim()
    ) {
      throw new Error("All profile fields are required and cannot be empty");
    }

    const existing = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing profile with all required fields
      await ctx.db.patch(existing._id, {
        first_name: args.firstName.trim(),
        last_name: args.lastName.trim(),
        institution: args.institution.trim(),
        geographic_location: args.geographicLocation.trim(),
        updated_at: now,
      });
      return { success: true };
    } else {
      // Create new profile with all required fields
      await ctx.db.insert("user_profiles", {
        user_id: args.userId,
        first_name: args.firstName.trim(),
        last_name: args.lastName.trim(),
        institution: args.institution.trim(),
        geographic_location: args.geographicLocation.trim(),
        updated_at: now,
      });
      return { success: true };
    }
  },
});

