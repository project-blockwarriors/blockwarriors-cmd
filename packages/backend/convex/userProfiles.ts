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

// Get user profile by userId with full details
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
        // Get team image URL
        let teamImageUrl = null;
        if (teamData.team_image_id) {
          teamImageUrl = await ctx.storage.getUrl(teamData.team_image_id);
        }
        
        team = {
          id: teamData._id,
          team_name: teamData.team_name,
          leader_id: teamData.leader_id,
          team_elo: teamData.team_elo,
          team_wins: teamData.team_wins,
          team_losses: teamData.team_losses,
          team_image_url: teamImageUrl,
          description: teamData.description,
        };
      }
    }

    // Get profile image URL if exists
    let profileImageUrl = null;
    if (profile.profile_image_id) {
      profileImageUrl = await ctx.storage.getUrl(profile.profile_image_id);
    }

    return {
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      institution: profile.institution,
      geographic_location: profile.geographic_location,
      team: team,
      profile_image_url: profileImageUrl,
      profile_image_id: profile.profile_image_id,
      bio: profile.bio,
      minecraft_username: profile.minecraft_username,
      discord_username: profile.discord_username,
      updated_at: profile.updated_at,
    };
  },
});

// Get user profile with team members - for profile page
export const getUserProfileWithTeamMembers = query({
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

    // Get team data and members if team_id exists
    let team = null;
    if (profile.team_id) {
      const teamData = await ctx.db.get(profile.team_id);
      if (teamData) {
        // Get team image URL
        let teamImageUrl = null;
        if (teamData.team_image_id) {
          teamImageUrl = await ctx.storage.getUrl(teamData.team_image_id);
        }
        
        // Get all team members
        const members = await ctx.db
          .query("user_profiles")
          .withIndex("by_team_id", (q) => q.eq("team_id", profile.team_id!))
          .collect();
        
        // Get profile images for members
        const membersWithImages = await Promise.all(
          members.map(async (member) => {
            let memberImageUrl = null;
            if (member.profile_image_id) {
              memberImageUrl = await ctx.storage.getUrl(member.profile_image_id);
            }
            return {
              user_id: member.user_id,
              first_name: member.first_name,
              last_name: member.last_name,
              profile_image_url: memberImageUrl,
              institution: member.institution,
              minecraft_username: member.minecraft_username,
            };
          })
        );
        
        team = {
          id: teamData._id,
          team_name: teamData.team_name,
          leader_id: teamData.leader_id,
          team_elo: teamData.team_elo,
          team_wins: teamData.team_wins,
          team_losses: teamData.team_losses,
          team_image_url: teamImageUrl,
          description: teamData.description,
          created_at: teamData.created_at,
          members: membersWithImages,
        };
      }
    }

    // Get profile image URL if exists
    let profileImageUrl = null;
    if (profile.profile_image_id) {
      profileImageUrl = await ctx.storage.getUrl(profile.profile_image_id);
    }

    return {
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      institution: profile.institution,
      geographic_location: profile.geographic_location,
      team: team,
      profile_image_url: profileImageUrl,
      profile_image_id: profile.profile_image_id,
      bio: profile.bio,
      minecraft_username: profile.minecraft_username,
      discord_username: profile.discord_username,
      updated_at: profile.updated_at,
    };
  },
});

// Initialize user profile from Google OAuth data (name, email, etc.)
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
    await ctx.db.insert("user_profiles", {
      user_id: args.userId,
      first_name: firstName,
      last_name: lastName,
      institution: "",
      geographic_location: "",
      updated_at: now,
    });

    return { success: true, alreadyExists: false };
  },
});

// Update user profile - basic fields
export const updateUserProfile = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    institution: v.string(),
    geographicLocation: v.string(),
    bio: v.optional(v.string()),
    
    discordUsername: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
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
      await ctx.db.patch(existing._id, {
        first_name: args.firstName.trim(),
        last_name: args.lastName.trim(),
        institution: args.institution.trim(),
        geographic_location: args.geographicLocation.trim(),
        bio: args.bio?.trim(),
        
        discord_username: args.discordUsername?.trim(),
        updated_at: now,
      });
      return { success: true };
    } else {
      await ctx.db.insert("user_profiles", {
        user_id: args.userId,
        first_name: args.firstName.trim(),
        last_name: args.lastName.trim(),
        institution: args.institution.trim(),
        geographic_location: args.geographicLocation.trim(),
        bio: args.bio?.trim(),
        
        discord_username: args.discordUsername?.trim(),
        updated_at: now,
      });
      return { success: true };
    }
  },
});

// Generate upload URL for profile image
export const generateProfileImageUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update profile image
export const updateProfileImage = mutation({
  args: {
    userId: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Delete old image if exists
    if (profile.profile_image_id) {
      await ctx.storage.delete(profile.profile_image_id);
    }

    // Update with new image
    await ctx.db.patch(profile._id, {
      profile_image_id: args.storageId,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// Delete profile image
export const deleteProfileImage = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Delete image if exists
    if (profile.profile_image_id) {
      await ctx.storage.delete(profile.profile_image_id);
    }

    // Remove image reference
    await ctx.db.patch(profile._id, {
      profile_image_id: undefined,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
