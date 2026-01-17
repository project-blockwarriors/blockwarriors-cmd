import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Check if user is an admin.
 * TODO: Implement actual admin check logic later.
 * For now, always returns false.
 */
async function checkUserIsAdmin(
  _ctx: any,
  _userId: string
): Promise<boolean> {
  // TODO: Implement admin check - check against settings table or dedicated admins table
  return false;
}

/**
 * Check if a user can act on behalf of a team (is a member of the team)
 */
async function canActForTeam(
  ctx: any,
  userId: string,
  teamId: Id<"teams">
): Promise<boolean> {
  const profile = await ctx.db
    .query("user_profiles")
    .withIndex("by_user_id", (q: any) => q.eq("user_id", userId))
    .first();
  return profile?.team_id === teamId;
}

/**
 * Get user's team ID from their profile
 */
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

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a tournament by ID with participant count
 */
export const getTournament = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  returns: v.union(
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      format: v.union(v.literal("round_robin"), v.literal("double_elim")),
      status: v.union(
        v.literal("registration"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      is_official: v.boolean(),
      created_by: v.string(),
      min_teams: v.number(),
      max_teams: v.number(),
      games_per_match: v.number(),
      registration_deadline: v.optional(v.number()),
      start_time: v.optional(v.number()),
      end_time: v.optional(v.number()),
      created_at: v.number(),
      participant_count: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return null;
    }

    // Count participants
    const participants = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    return {
      ...tournament,
      participant_count: participants.length,
    };
  },
});

/**
 * List tournaments with optional filters
 */
export const listTournaments = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("registration"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    isOfficial: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      format: v.union(v.literal("round_robin"), v.literal("double_elim")),
      status: v.union(
        v.literal("registration"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      is_official: v.boolean(),
      created_by: v.string(),
      min_teams: v.number(),
      max_teams: v.number(),
      games_per_match: v.number(),
      registration_deadline: v.optional(v.number()),
      start_time: v.optional(v.number()),
      end_time: v.optional(v.number()),
      created_at: v.number(),
      participant_count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let tournamentsQuery;

    if (args.status) {
      tournamentsQuery = ctx.db
        .query("tournaments")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else if (args.isOfficial !== undefined) {
      tournamentsQuery = ctx.db
        .query("tournaments")
        .withIndex("by_is_official", (q) =>
          q.eq("is_official", args.isOfficial!)
        );
    } else {
      tournamentsQuery = ctx.db.query("tournaments");
    }

    const tournaments = await tournamentsQuery.order("desc").collect();

    // Filter by isOfficial if both status and isOfficial are provided
    const filteredTournaments =
      args.status && args.isOfficial !== undefined
        ? tournaments.filter((t) => t.is_official === args.isOfficial)
        : tournaments;

    // Get participant counts for each tournament
    const tournamentsWithCounts = await Promise.all(
      filteredTournaments.map(async (tournament) => {
        const participants = await ctx.db
          .query("tournament_participants")
          .withIndex("by_tournament_id", (q) =>
            q.eq("tournament_id", tournament._id)
          )
          .collect();

        return {
          ...tournament,
          participant_count: participants.length,
        };
      })
    );

    return tournamentsWithCounts;
  },
});

/**
 * Get tournaments where the user's team is participating
 */
export const getMyTournaments = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      format: v.union(v.literal("round_robin"), v.literal("double_elim")),
      status: v.union(
        v.literal("registration"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      is_official: v.boolean(),
      created_by: v.string(),
      min_teams: v.number(),
      max_teams: v.number(),
      games_per_match: v.number(),
      registration_deadline: v.optional(v.number()),
      start_time: v.optional(v.number()),
      end_time: v.optional(v.number()),
      created_at: v.number(),
      participant_count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get user's team
    const teamId = await getUserTeamId(ctx, args.userId);
    if (!teamId) {
      return [];
    }

    // Get all tournament participations for this team
    const participations = await ctx.db
      .query("tournament_participants")
      .withIndex("by_team_id", (q) => q.eq("team_id", teamId))
      .collect();

    // Get tournament details for each participation
    const tournaments = await Promise.all(
      participations.map(async (participation) => {
        const tournament = await ctx.db.get(participation.tournament_id);
        if (!tournament) return null;

        const participants = await ctx.db
          .query("tournament_participants")
          .withIndex("by_tournament_id", (q) =>
            q.eq("tournament_id", tournament._id)
          )
          .collect();

        return {
          ...tournament,
          participant_count: participants.length,
        };
      })
    );

    // Filter out nulls and return
    return tournaments.filter((t) => t !== null) as typeof tournaments extends (infer T | null)[] ? NonNullable<T>[] : never;
  },
});

/**
 * Get tournament participants with team details
 */
export const getTournamentParticipants = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  returns: v.array(
    v.object({
      _id: v.id("tournament_participants"),
      tournament_id: v.id("tournaments"),
      team_id: v.id("teams"),
      seed: v.optional(v.number()),
      joined_at: v.number(),
      team_name: v.string(),
      team_elo: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    const participantsWithTeams = await Promise.all(
      participants.map(async (p) => {
        const team = await ctx.db.get(p.team_id);
        return {
          _id: p._id,
          tournament_id: p.tournament_id,
          team_id: p.team_id,
          seed: p.seed,
          joined_at: p.joined_at,
          team_name: team?.team_name ?? "Unknown Team",
          team_elo: team?.team_elo ?? 0,
        };
      })
    );

    return participantsWithTeams;
  },
});

/**
 * Check if user's team is registered in a tournament
 */
export const isTeamRegistered = query({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const teamId = await getUserTeamId(ctx, args.userId);
    if (!teamId) {
      return false;
    }

    const participation = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id_and_team_id", (q) =>
        q.eq("tournament_id", args.tournamentId).eq("team_id", teamId)
      )
      .first();

    return participation !== null;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new tournament
 */
export const createTournament = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    format: v.union(v.literal("round_robin"), v.literal("double_elim")),
    isOfficial: v.boolean(),
    createdBy: v.string(),
    minTeams: v.number(),
    maxTeams: v.number(),
    gamesPerMatch: v.number(),
    registrationDeadline: v.optional(v.number()),
    startTime: v.optional(v.number()),
  },
  returns: v.id("tournaments"),
  handler: async (ctx, args) => {
    // Check if user can create official tournaments
    if (args.isOfficial) {
      const isAdmin = await checkUserIsAdmin(ctx, args.createdBy);
      if (!isAdmin) {
        throw new Error("Only admins can create official tournaments");
      }
    }

    // Validate team limits
    if (args.minTeams < 2) {
      throw new Error("Minimum teams must be at least 2");
    }
    if (args.maxTeams < args.minTeams) {
      throw new Error("Maximum teams must be greater than or equal to minimum teams");
    }
    if (args.gamesPerMatch < 1) {
      throw new Error("Games per match must be at least 1");
    }

    const now = Date.now();

    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.name,
      description: args.description,
      format: args.format,
      status: "registration",
      is_official: args.isOfficial,
      created_by: args.createdBy,
      min_teams: args.minTeams,
      max_teams: args.maxTeams,
      games_per_match: args.gamesPerMatch,
      registration_deadline: args.registrationDeadline,
      start_time: args.startTime,
      created_at: now,
    });

    return tournamentId;
  },
});

/**
 * Join a tournament (any team member can invoke)
 */
export const joinTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    participantId: v.optional(v.id("tournament_participants")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get tournament
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Check tournament is in registration phase
    if (tournament.status !== "registration") {
      return { success: false, error: "Tournament is not accepting registrations" };
    }

    // Check registration deadline
    if (tournament.registration_deadline && Date.now() > tournament.registration_deadline) {
      return { success: false, error: "Registration deadline has passed" };
    }

    // Get user's team
    const teamId = await getUserTeamId(ctx, args.userId);
    if (!teamId) {
      return { success: false, error: "You must be on a team to join a tournament" };
    }

    if (tournament.is_official) {
      const team = await ctx.db.get(teamId);
      if (!team || team.leader_id !== args.userId) {
        return {
          success: false,
          error: "Only team leaders can register for official tournaments",
        };
      }
    }

    // Check if team is already registered
    const existingParticipation = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id_and_team_id", (q) =>
        q.eq("tournament_id", args.tournamentId).eq("team_id", teamId)
      )
      .first();

    if (existingParticipation) {
      return { success: false, error: "Your team is already registered in this tournament" };
    }

    // Check if tournament is full
    const participants = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    if (participants.length >= tournament.max_teams) {
      return { success: false, error: "Tournament is full" };
    }

    // Register team
    const participantId = await ctx.db.insert("tournament_participants", {
      tournament_id: args.tournamentId,
      team_id: teamId,
      joined_at: Date.now(),
    });

    return { success: true, participantId };
  },
});

/**
 * Leave a tournament (any team member can invoke, only before tournament starts)
 */
export const leaveTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get tournament
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Check tournament is still in registration phase
    if (tournament.status !== "registration") {
      return { success: false, error: "Cannot leave tournament after it has started" };
    }

    // Get user's team
    const teamId = await getUserTeamId(ctx, args.userId);
    if (!teamId) {
      return { success: false, error: "You are not on a team" };
    }

    if (tournament.is_official) {
      const team = await ctx.db.get(teamId);
      if (!team || team.leader_id !== args.userId) {
        return {
          success: false,
          error: "Only team leaders can withdraw from official tournaments",
        };
      }
    }

    // Find and delete participation
    const participation = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id_and_team_id", (q) =>
        q.eq("tournament_id", args.tournamentId).eq("team_id", teamId)
      )
      .first();

    if (!participation) {
      return { success: false, error: "Your team is not registered in this tournament" };
    }

    await ctx.db.delete(participation._id);

    return { success: true };
  },
});

/**
 * Start a tournament (generates matches based on format)
 * Only tournament creator or admin can start
 */
export const startTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    matchesGenerated: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // Get tournament
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Check permissions (creator or admin)
    const isAdmin = await checkUserIsAdmin(ctx, args.userId);
    if (tournament.created_by !== args.userId && !isAdmin) {
      return { success: false, error: "Only the tournament creator or admin can start the tournament" };
    }

    // Check tournament is in registration phase
    if (tournament.status !== "registration") {
      return { success: false, error: "Tournament has already started or ended" };
    }

    // Get participants
    const participants = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    // Check minimum teams
    if (participants.length < tournament.min_teams) {
      return { 
        success: false, 
        error: `Not enough teams. Need at least ${tournament.min_teams}, have ${participants.length}` 
      };
    }

    // Generate matches based on format
    let matchesGenerated = 0;

    if (tournament.format === "round_robin") {
      // Round Robin: each team plays every other team once
      // Total matches = n * (n-1) / 2 where n is number of teams
      const teamIds = participants.map((p) => p.team_id);
      let matchNumber = 0;

      // Use circle method for round robin scheduling
      // This ensures fair distribution of rounds
      const numTeams = teamIds.length;
      const numRounds = numTeams % 2 === 0 ? numTeams - 1 : numTeams;
      const halfSize = Math.floor(numTeams / 2);
      
      // Create a copy of team IDs for rotation (excluding first team if even)
      const teams = [...teamIds];
      
      for (let round = 0; round < numRounds; round++) {
        // Generate matches for this round
        for (let i = 0; i < halfSize; i++) {
          const team1Index = i;
          const team2Index = numTeams - 1 - i;
          
          // Skip if we're matching a team with a "bye" position
          if (team2Index >= teams.length) continue;
          
          const team1Id = teams[team1Index];
          const team2Id = teams[team2Index];
          
          // Skip if either team is undefined (shouldn't happen but safety check)
          if (!team1Id || !team2Id) continue;

          await ctx.db.insert("tournament_matches", {
            tournament_id: args.tournamentId,
            round: round + 1,
            match_number: matchNumber++,
            team1_id: team1Id,
            team2_id: team2Id,
            status: "pending",
            games: [],
            games_required: tournament.games_per_match,
            team1_games_won: 0,
            team2_games_won: 0,
          });

          matchesGenerated++;
        }

        // Rotate teams (keep first team fixed if even number)
        if (numTeams % 2 === 0) {
          // Even: rotate all except first
          const last = teams.pop()!;
          teams.splice(1, 0, last);
        } else {
          // Odd: rotate all
          const last = teams.pop()!;
          teams.unshift(last);
        }
      }
    } else if (tournament.format === "double_elim") {
      // Double elimination will be implemented later
      // For now, return an error
      return { success: false, error: "Double elimination format is not yet implemented" };
    }

    // Update tournament status
    await ctx.db.patch(args.tournamentId, {
      status: "in_progress",
      start_time: Date.now(),
    });

    return { success: true, matchesGenerated };
  },
});

/**
 * Cancel a tournament (only creator or admin)
 */
export const cancelTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get tournament
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Check permissions (creator or admin)
    const isAdmin = await checkUserIsAdmin(ctx, args.userId);
    if (tournament.created_by !== args.userId && !isAdmin) {
      return { success: false, error: "Only the tournament creator or admin can cancel the tournament" };
    }

    // Check tournament is not already completed
    if (tournament.status === "completed") {
      return { success: false, error: "Cannot cancel a completed tournament" };
    }

    if (tournament.status === "cancelled") {
      return { success: false, error: "Tournament is already cancelled" };
    }

    // Cancel all pending/scheduled matches
    const matches = await ctx.db
      .query("tournament_matches")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    for (const match of matches) {
      if (match.status === "pending" || match.status === "scheduled") {
        await ctx.db.patch(match._id, { status: "cancelled" });
      }
    }

    // Update tournament status
    await ctx.db.patch(args.tournamentId, {
      status: "cancelled",
      end_time: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update tournament settings (only creator or admin, only during registration)
 */
export const updateTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    minTeams: v.optional(v.number()),
    maxTeams: v.optional(v.number()),
    gamesPerMatch: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),
    startTime: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get tournament
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Check permissions
    const isAdmin = await checkUserIsAdmin(ctx, args.userId);
    if (tournament.created_by !== args.userId && !isAdmin) {
      return { success: false, error: "Only the tournament creator or admin can update the tournament" };
    }

    // Can only update during registration phase
    if (tournament.status !== "registration") {
      return { success: false, error: "Can only update tournament during registration phase" };
    }

    // Validate team limits before updating
    const newMinTeams = args.minTeams ?? tournament.min_teams;
    const newMaxTeams = args.maxTeams ?? tournament.max_teams;

    if (args.minTeams !== undefined && args.minTeams < 2) {
      return { success: false, error: "Minimum teams must be at least 2" };
    }

    if (newMaxTeams < newMinTeams) {
      return { success: false, error: "Maximum teams must not be less than minimum teams" };
    }

    if (args.gamesPerMatch !== undefined && args.gamesPerMatch < 1) {
      return { success: false, error: "Games per match must be at least 1" };
    }

    // Check against current participant count
    const participants = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    if (args.maxTeams !== undefined && participants.length > args.maxTeams) {
      return { 
        success: false, 
        error: `Cannot reduce max teams below current participant count (${participants.length})` 
      };
    }

    // Build update object
    const updates: Partial<{
      name: string;
      description: string;
      min_teams: number;
      max_teams: number;
      games_per_match: number;
      registration_deadline: number;
      start_time: number;
    }> = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.minTeams !== undefined) updates.min_teams = args.minTeams;
    if (args.maxTeams !== undefined) updates.max_teams = args.maxTeams;
    if (args.gamesPerMatch !== undefined) updates.games_per_match = args.gamesPerMatch;
    if (args.registrationDeadline !== undefined) updates.registration_deadline = args.registrationDeadline;
    if (args.startTime !== undefined) updates.start_time = args.startTime;

    await ctx.db.patch(args.tournamentId, updates);

    return { success: true };
  },
});
