import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all teams with their members
export const getAllTeamsWithMembers = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("teams"),
      team_name: v.string(),
      leader_id: v.string(),
      team_elo: v.number(),
      team_wins: v.number(),
      team_losses: v.number(),
      members: v.array(
        v.object({
          user_id: v.string(),
          first_name: v.string(),
          last_name: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        // Get all users in this team
        const members = await ctx.db
          .query("user_profiles")
          .withIndex("by_team_id", (q) => q.eq("team_id", team._id))
          .collect();

        return {
          id: team._id,
          team_name: team.team_name,
          leader_id: team.leader_id,
          team_elo: team.team_elo,
          team_wins: team.team_wins,
          team_losses: team.team_losses,
          members: members.map((member) => ({
            user_id: member.user_id,
            first_name: member.first_name,
            last_name: member.last_name,
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
  returns: v.union(
    v.object({
      id: v.id("teams"),
      team_name: v.string(),
      leader_id: v.string(),
      team_elo: v.number(),
      team_wins: v.number(),
      team_losses: v.number(),
      members: v.array(
        v.object({
          user_id: v.string(),
          first_name: v.string(),
          last_name: v.string(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }

    const members = await ctx.db
      .query("user_profiles")
      .withIndex("by_team_id", (q) => q.eq("team_id", args.teamId))
      .collect();

    return {
      id: team._id,
      team_name: team.team_name,
      leader_id: team.leader_id,
      team_elo: team.team_elo,
      team_wins: team.team_wins,
      team_losses: team.team_losses,
      members: members.map((member) => ({
        user_id: member.user_id,
        first_name: member.first_name,
        last_name: member.last_name,
      })),
    };
  },
});

// Get team leaderboard (sorted by ELO)
export const getTeamLeaderboard = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("teams"),
      team_name: v.string(),
      leader_id: v.string(),
      team_elo: v.number(),
      team_wins: v.number(),
      team_losses: v.number(),
    })
  ),
  handler: async (ctx) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_team_elo")
      .order("desc")
      .collect();

    return teams.map((team) => ({
      id: team._id,
      team_name: team.team_name,
      leader_id: team.leader_id,
      team_elo: team.team_elo,
      team_wins: team.team_wins,
      team_losses: team.team_losses,
    }));
  },
});

// Create a new team
export const createTeam = mutation({
  args: {
    teamName: v.string(),
    leaderId: v.string(),
  },
  returns: v.object({
    id: v.id("teams"),
    team_name: v.string(),
    leader_id: v.string(),
    team_elo: v.number(),
    team_wins: v.number(),
    team_losses: v.number(),
  }),
  handler: async (ctx, args) => {
    // Check if user is already in a team
    const userProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.leaderId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.team_id) {
      throw new Error("You are already a member of a team");
    }

    // Check if team name already exists
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_team_name", (q) => q.eq("team_name", args.teamName))
      .first();

    if (existingTeam) {
      throw new Error("Team name already exists");
    }

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      team_name: args.teamName,
      leader_id: args.leaderId,
      team_elo: 0,
      team_wins: 0,
      team_losses: 0,
    });

    const now = Date.now();

    // Update user's team_id
    await ctx.db.patch(userProfile._id, {
      team_id: teamId,
      updated_at: now,
    });

    const team = await ctx.db.get(teamId);
    if (!team) {
      throw new Error("Failed to create team");
    }

    return {
      id: team._id,
      team_name: team.team_name,
      leader_id: team.leader_id,
      team_elo: team.team_elo,
      team_wins: team.team_wins,
      team_losses: team.team_losses,
    };
  },
});

// Update user's team (join or leave)
export const updateUserTeam = mutation({
  args: {
    userId: v.string(),
    teamId: v.union(v.id("teams"), v.null()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const now = Date.now();
    await ctx.db.patch(userProfile._id, {
      team_id: args.teamId ?? undefined,
      updated_at: now,
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
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Verify team exists
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is already in a team
    const userProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.team_id) {
      throw new Error("You are already a member of a team");
    }

    const now = Date.now();
    await ctx.db.patch(userProfile._id, {
      team_id: args.teamId,
      updated_at: now,
    });

    return { success: true };
  },
});

// Leave a team
export const leaveTeam = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (!userProfile.team_id) {
      throw new Error("You are not a member of any team");
    }

    const now = Date.now();
    await ctx.db.patch(userProfile._id, {
      team_id: undefined,
      updated_at: now,
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
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Verify team exists and user is the leader
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.leader_id !== args.leaderId) {
      throw new Error("Only the team leader can disband the team");
    }

    // Get all team members
    const members = await ctx.db
      .query("user_profiles")
      .withIndex("by_team_id", (q) => q.eq("team_id", args.teamId))
      .collect();

    const now = Date.now();

    // Remove team from all members
    await Promise.all(
      members.map((member) =>
        ctx.db.patch(member._id, {
          team_id: undefined,
          updated_at: now,
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
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }
    return team.team_elo;
  },
});

// Get all teams scores
export const getAllTeamsScores = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("teams"),
      team_name: v.string(),
      leader_id: v.string(),
      team_elo: v.number(),
      team_wins: v.number(),
      team_losses: v.number(),
    })
  ),
  handler: async (ctx) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_team_elo")
      .order("desc")
      .collect();

    return teams.map((team) => ({
      id: team._id,
      team_name: team.team_name,
      leader_id: team.leader_id,
      team_elo: team.team_elo,
      team_wins: team.team_wins,
      team_losses: team.team_losses,
    }));
  },
});


