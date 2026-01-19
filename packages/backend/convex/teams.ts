import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

const MAX_TEAM_MEMBERS = 5;

async function getTeamMemberCount(ctx: any, teamId: Id<"teams">) {
  const members = await ctx.db
    .query("user_profiles")
    .withIndex("by_team_id", (q: any) => q.eq("team_id", teamId))
    .collect();
  return members.length;
}

async function getUserTeamId(
  ctx: any,
  userId: string
): Promise<Id<"teams"> | null> {
  const profile = await ctx.db
    .query("user_profiles")
    .withIndex("by_user_id", (q: any) => q.eq("user_id", userId))
    .first();
  return profile?.team_id ?? null;
}

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
      team_ties: v.number(),
      description: v.optional(v.string()),
      team_image_url: v.optional(v.string()),
      created_at: v.optional(v.number()),
      members: v.array(
        v.object({
          user_id: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          profile_image_url: v.optional(v.string()),
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

        // Get team image URL
        let teamImageUrl = null;
        if (team.team_image_id) {
          teamImageUrl = await ctx.storage.getUrl(team.team_image_id);
        }

        // Get member profile images
        const membersWithImages = await Promise.all(
          members.map(async (member) => {
            let profileImageUrl = null;
            if (member.profile_image_id) {
              profileImageUrl = await ctx.storage.getUrl(member.profile_image_id);
            }
            return {
              user_id: member.user_id,
              first_name: member.first_name,
              last_name: member.last_name,
              profile_image_url: profileImageUrl ?? undefined,
            };
          })
        );

        return {
          id: team._id,
          team_name: team.team_name,
          leader_id: team.leader_id,
          team_elo: team.team_elo,
          team_wins: team.team_wins,
          team_losses: team.team_losses,
          team_ties: team.team_ties ?? 0,
          description: team.description,
          team_image_url: teamImageUrl ?? undefined,
          created_at: team.created_at,
          members: membersWithImages,
        };
      })
    );

    return teamsWithMembers;
  },
});

// Get team by ID with full details
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
      description: v.optional(v.string()),
      team_image_url: v.optional(v.string()),
      created_at: v.optional(v.number()),
      members: v.array(
        v.object({
          user_id: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          profile_image_url: v.optional(v.string()),
          institution: v.string(),
          minecraft_username: v.optional(v.string()),
          discord_username: v.optional(v.string()),
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

    // Get team image URL
    let teamImageUrl = null;
    if (team.team_image_id) {
      teamImageUrl = await ctx.storage.getUrl(team.team_image_id);
    }

    // Get member profile images
    const membersWithImages = await Promise.all(
      members.map(async (member) => {
        let profileImageUrl = null;
        if (member.profile_image_id) {
          profileImageUrl = await ctx.storage.getUrl(member.profile_image_id);
        }
        return {
          user_id: member.user_id,
          first_name: member.first_name,
          last_name: member.last_name,
          profile_image_url: profileImageUrl ?? undefined,
          institution: member.institution,
          minecraft_username: member.minecraft_username,
          discord_username: member.discord_username,
        };
      })
    );

      return {
        id: team._id,
        team_name: team.team_name,
        leader_id: team.leader_id,
        team_elo: team.team_elo,
        team_wins: team.team_wins,
        team_losses: team.team_losses,
        team_ties: team.team_ties ?? 0,
        description: team.description,
        team_image_url: teamImageUrl ?? undefined,
        created_at: team.created_at,
      members: membersWithImages,
    };
  },
});

// Create a new team
export const createTeam = mutation({
  args: {
    teamName: v.string(),
    leaderId: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.object({
    id: v.id("teams"),
    team_name: v.string(),
    leader_id: v.string(),
    team_elo: v.number(),
    team_wins: v.number(),
    team_losses: v.number(),
    team_ties: v.number(),
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

    const now = Date.now();

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      team_name: args.teamName,
      leader_id: args.leaderId,
      team_elo: 1000, // Start with 1000 ELO
      team_wins: 0,
      team_losses: 0,
      team_ties: 0,
      description: args.description,
      created_at: now,
    });

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
      team_ties: team.team_ties ?? 0,
    };
  },
});

// Update team details
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
    teamName: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Only leader can update team
    if (team.leader_id !== args.userId) {
      return { success: false, error: "Only the team leader can update the team" };
    }

    // Check if new name already exists (if changing name)
    if (args.teamName && args.teamName !== team.team_name) {
      const existingTeam = await ctx.db
        .query("teams")
        .withIndex("by_team_name", (q) => q.eq("team_name", args.teamName!))
        .first();

      if (existingTeam) {
        return { success: false, error: "Team name already exists" };
      }
    }

    const updates: Partial<{ team_name: string; description: string }> = {};
    if (args.teamName) updates.team_name = args.teamName;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.teamId, updates);

    return { success: true };
  },
});

// Generate upload URL for team image
export const generateTeamImageUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update team image
export const updateTeamImage = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Only leader can update team image
    if (team.leader_id !== args.userId) {
      return { success: false, error: "Only the team leader can update the team image" };
    }

    // Delete old image if exists
    if (team.team_image_id) {
      await ctx.storage.delete(team.team_image_id);
    }

    await ctx.db.patch(args.teamId, {
      team_image_id: args.storageId,
    });

    return { success: true };
  },
});

// Delete team image
export const deleteTeamImage = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Only leader can delete team image
    if (team.leader_id !== args.userId) {
      return { success: false, error: "Only the team leader can delete the team image" };
    }

    // Delete image if exists
    if (team.team_image_id) {
      await ctx.storage.delete(team.team_image_id);
    }

    await ctx.db.patch(args.teamId, {
      team_image_id: undefined,
    });

    return { success: true };
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

    const memberCount = await getTeamMemberCount(ctx, args.teamId);
    if (memberCount >= MAX_TEAM_MEMBERS) {
      throw new Error("Team is full");
    }

    const existingRequest = await ctx.db
      .query("team_join_requests")
      .withIndex("by_team_id_and_user_id", (q: any) =>
        q.eq("team_id", args.teamId).eq("user_id", args.userId)
      )
      .first();

    if (existingRequest) {
      throw new Error("You already have a pending join request");
    }

    const now = Date.now();
    await ctx.db.insert("team_join_requests", {
      team_id: args.teamId,
      user_id: args.userId,
      requested_at: now,
    });

    return { success: true };
  },
});

// Get a user's pending join request for a team
export const getJoinRequestForTeam = query({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("team_join_requests"),
      team_id: v.id("teams"),
      user_id: v.string(),
      requested_at: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const currentTeamId = await getUserTeamId(ctx, args.userId);
    if (currentTeamId) {
      return null;
    }

    const request = await ctx.db
      .query("team_join_requests")
      .withIndex("by_team_id_and_user_id", (q: any) =>
        q.eq("team_id", args.teamId).eq("user_id", args.userId)
      )
      .first();

    if (!request) {
      return null;
    }

    return {
      _id: request._id,
      team_id: request.team_id,
      user_id: request.user_id,
      requested_at: request.requested_at,
    };
  },
});

// Cancel a pending join request
export const cancelJoinRequest = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("team_join_requests")
      .withIndex("by_team_id_and_user_id", (q: any) =>
        q.eq("team_id", args.teamId).eq("user_id", args.userId)
      )
      .first();

    if (!request) {
      return { success: true };
    }

    await ctx.db.delete(request._id);
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

    // Check if user is the leader - leaders must disband or transfer leadership
    const team = await ctx.db.get(userProfile.team_id);
    if (team && team.leader_id === args.userId) {
      throw new Error("Team leaders cannot leave. You must disband the team or transfer leadership first.");
    }

    const now = Date.now();
    await ctx.db.patch(userProfile._id, {
      team_id: undefined,
      updated_at: now,
    });

    return { success: true };
  },
});

// Transfer team leadership
export const transferLeadership = mutation({
  args: {
    teamId: v.id("teams"),
    currentLeaderId: v.string(),
    newLeaderId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    if (team.leader_id !== args.currentLeaderId) {
      return { success: false, error: "Only the current leader can transfer leadership" };
    }

    // Verify new leader is on the team
    const newLeaderProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.newLeaderId))
      .first();

    if (!newLeaderProfile || newLeaderProfile.team_id !== args.teamId) {
      return { success: false, error: "New leader must be a member of the team" };
    }

    await ctx.db.patch(args.teamId, {
      leader_id: args.newLeaderId,
    });

    return { success: true };
  },
});

// Disband a team (only leader can do this)
// This also handles tournament forfeits
export const disbandTeam = mutation({
  args: {
    teamId: v.id("teams"),
    leaderId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    forfeitedTournaments: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify team exists and user is the leader
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    if (team.leader_id !== args.leaderId) {
      return { success: false, error: "Only the team leader can disband the team" };
    }

    // Handle tournament forfeits
    // Find all tournament participations for this team
    const participations = await ctx.db
      .query("tournament_participants")
      .withIndex("by_team_id", (q) => q.eq("team_id", args.teamId))
      .collect();

    let forfeitedTournaments = 0;

    for (const participation of participations) {
      const tournament = await ctx.db.get(participation.tournament_id);
      
      if (!tournament) continue;
      
      // Only process active tournaments
      if (tournament.status === "in_progress") {
        // Find all matches involving this team that are not completed
        const matches = await ctx.db
          .query("tournament_matches")
          .withIndex("by_tournament_id", (q) =>
            q.eq("tournament_id", participation.tournament_id)
          )
          .collect();

        for (const match of matches) {
          // Check if this team is in the match
          const isTeam1 = match.team1_id === args.teamId;
          const isTeam2 = match.team2_id === args.teamId;
          
          if (!isTeam1 && !isTeam2) continue;
          
          // Only forfeit matches that aren't already completed or cancelled
          if (match.status === "completed" || match.status === "cancelled") continue;

          // Determine the opponent (winner by forfeit)
          const opponentId = isTeam1 ? match.team2_id : match.team1_id;
          
          if (opponentId) {
            // Forfeit: opponent wins with full games
            await ctx.db.patch(match._id, {
              status: "completed",
              winner_team_id: opponentId,
              // Give opponent max games won, forfeiting team gets 0
              team1_games_won: isTeam1 ? 0 : match.games_required,
              team2_games_won: isTeam2 ? 0 : match.games_required,
            });

            // Update opponent's team wins
            const opponentTeam = await ctx.db.get(opponentId);
            if (opponentTeam) {
              await ctx.db.patch(opponentId, {
                team_wins: opponentTeam.team_wins + 1,
              });
            }
          } else {
            // No opponent (shouldn't happen in round robin), just cancel
            await ctx.db.patch(match._id, {
              status: "cancelled",
            });
          }
        }

        forfeitedTournaments++;

        // Check if tournament should complete after forfeits
        const allMatches = await ctx.db
          .query("tournament_matches")
          .withIndex("by_tournament_id", (q) =>
            q.eq("tournament_id", participation.tournament_id)
          )
          .collect();

        const allDone = allMatches.every(
          (m) => m.status === "completed" || m.status === "cancelled"
        );

        if (allDone && allMatches.length > 0) {
          await ctx.db.patch(participation.tournament_id, {
            status: "completed",
            end_time: Date.now(),
          });
        }
      }

      // Remove team from tournament participants
      await ctx.db.delete(participation._id);
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

    // Delete team image if exists
    if (team.team_image_id) {
      await ctx.storage.delete(team.team_image_id);
    }

    // Delete any pending join requests
    const joinRequests = await ctx.db
      .query("team_join_requests")
      .withIndex("by_team_id", (q) => q.eq("team_id", args.teamId))
      .collect();
    await Promise.all(joinRequests.map((request) => ctx.db.delete(request._id)));

    // Delete the team
    await ctx.db.delete(args.teamId);

    return { success: true, forfeitedTournaments };
  },
});

// Get join requests for a team (any team member can view)
export const getTeamJoinRequests = query({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("team_join_requests"),
      team_id: v.id("teams"),
      user_id: v.string(),
      requested_at: v.number(),
      first_name: v.string(),
      last_name: v.string(),
      institution: v.optional(v.string()),
      profile_image_url: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const userTeamId = await getUserTeamId(ctx, args.userId);
    if (!userTeamId || userTeamId !== args.teamId) {
      return [];
    }

    const requests = await ctx.db
      .query("team_join_requests")
      .withIndex("by_team_id", (q) => q.eq("team_id", args.teamId))
      .collect();

    const requestsWithProfiles = await Promise.all(
      requests.map(async (request) => {
        const profile = await ctx.db
          .query("user_profiles")
          .withIndex("by_user_id", (q: any) => q.eq("user_id", request.user_id))
          .first();

        let profileImageUrl = null;
        if (profile?.profile_image_id) {
          profileImageUrl = await ctx.storage.getUrl(profile.profile_image_id);
        }

        return {
          _id: request._id,
          team_id: request.team_id,
          user_id: request.user_id,
          requested_at: request.requested_at,
          first_name: profile?.first_name ?? "Unknown",
          last_name: profile?.last_name ?? "User",
          institution: profile?.institution,
          profile_image_url: profileImageUrl ?? undefined,
        };
      })
    );

    return requestsWithProfiles;
  },
});

// Accept or decline a join request (any team member can respond)
export const respondToJoinRequest = mutation({
  args: {
    requestId: v.id("team_join_requests"),
    userId: v.string(),
    action: v.union(v.literal("accept"), v.literal("decline")),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return { success: false, error: "Join request not found" };
    }

    const userTeamId = await getUserTeamId(ctx, args.userId);
    if (!userTeamId || userTeamId !== request.team_id) {
      return { success: false, error: "You are not a member of this team" };
    }

    if (args.action === "decline") {
      await ctx.db.delete(args.requestId);
      return { success: true };
    }

    const team = await ctx.db.get(request.team_id);
    if (!team) {
      await ctx.db.delete(args.requestId);
      return { success: false, error: "Team not found" };
    }

    const requesterProfile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user_id", (q: any) => q.eq("user_id", request.user_id))
      .first();

    if (!requesterProfile) {
      await ctx.db.delete(args.requestId);
      return { success: false, error: "User profile not found" };
    }

    if (requesterProfile.team_id) {
      await ctx.db.delete(args.requestId);
      return { success: false, error: "User is already on a team" };
    }

    const memberCount = await getTeamMemberCount(ctx, request.team_id);
    if (memberCount >= MAX_TEAM_MEMBERS) {
      return { success: false, error: "Team is full" };
    }

    const now = Date.now();
    await ctx.db.patch(requesterProfile._id, {
      team_id: request.team_id,
      updated_at: now,
    });
    await ctx.db.delete(args.requestId);

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

// Get all teams scores (for leaderboard)
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
      team_ties: v.number(),
      team_image_url: v.optional(v.string()),
      member_count: v.number(),
    })
  ),
  handler: async (ctx) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_team_elo")
      .order("desc")
      .collect();

    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        // Get member count
        const members = await ctx.db
          .query("user_profiles")
          .withIndex("by_team_id", (q) => q.eq("team_id", team._id))
          .collect();

        // Get team image URL
        let teamImageUrl = null;
        if (team.team_image_id) {
          teamImageUrl = await ctx.storage.getUrl(team.team_image_id);
        }

        return {
          id: team._id,
          team_name: team.team_name,
          leader_id: team.leader_id,
          team_elo: team.team_elo,
          team_wins: team.team_wins,
          team_losses: team.team_losses,
          team_ties: team.team_ties ?? 0,
          team_image_url: teamImageUrl ?? undefined,
          member_count: members.length,
        };
      })
    );

    return teamsWithDetails;
  },
});

// Get team tournament history
export const getTeamTournamentHistory = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.array(
    v.object({
      tournament_id: v.id("tournaments"),
      tournament_name: v.string(),
      format: v.union(v.literal("round_robin"), v.literal("double_elim")),
      status: v.union(
        v.literal("registration"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      matches_played: v.number(),
      matches_won: v.number(),
      matches_lost: v.number(),
      matches_tied: v.number(),
      final_placement: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("tournament_participants")
      .withIndex("by_team_id", (q) => q.eq("team_id", args.teamId))
      .collect();

    const history = await Promise.all(
      participations.map(async (p) => {
        const tournament = await ctx.db.get(p.tournament_id);
        if (!tournament) return null;

        // Get matches for this team in this tournament
        const matches = await ctx.db
          .query("tournament_matches")
          .withIndex("by_tournament_id", (q) =>
            q.eq("tournament_id", p.tournament_id)
          )
          .collect();

        const teamMatches = matches.filter(
          (m) => m.team1_id === args.teamId || m.team2_id === args.teamId
        );
        
        const completedMatches = teamMatches.filter(
          (m) => m.status === "completed"
        );
        
        const matchesWon = completedMatches.filter(
          (m) => m.winner_team_id === args.teamId
        ).length;
        const matchesTied = completedMatches.filter(
          (m) =>
            !m.winner_team_id && m.team1_games_won === m.team2_games_won
        ).length;
        const matchesLost = Math.max(
          0,
          completedMatches.length - matchesWon - matchesTied
        );

        return {
          tournament_id: p.tournament_id,
          tournament_name: tournament.name,
          format: tournament.format,
          status: tournament.status,
          matches_played: completedMatches.length,
          matches_won: matchesWon,
          matches_lost: matchesLost,
          matches_tied: matchesTied,
          final_placement: undefined as number | undefined, // Could calculate this based on standings
        };
      })
    );

    return history.filter((h): h is NonNullable<typeof h> => h !== null);
  },
});
