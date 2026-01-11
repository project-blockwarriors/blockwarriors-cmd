import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Check if user is an admin.
 * TODO: Implement actual admin check logic later.
 */
async function checkUserIsAdmin(
  _ctx: any,
  _userId: string
): Promise<boolean> {
  return false;
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
 * Get all matches for a tournament (for bracket view)
 */
export const getTournamentBracket = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  returns: v.array(
    v.object({
      _id: v.id("tournament_matches"),
      tournament_id: v.id("tournaments"),
      round: v.number(),
      match_number: v.number(),
      team1_id: v.optional(v.id("teams")),
      team2_id: v.optional(v.id("teams")),
      team1_name: v.optional(v.string()),
      team2_name: v.optional(v.string()),
      winner_team_id: v.optional(v.id("teams")),
      status: v.union(
        v.literal("pending"),
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      scheduled_time: v.optional(v.number()),
      games: v.array(v.id("matches")),
      games_required: v.number(),
      team1_games_won: v.number(),
      team2_games_won: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("tournament_matches")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    // Enrich with team names
    const matchesWithTeams = await Promise.all(
      matches.map(async (match) => {
        const team1 = match.team1_id ? await ctx.db.get(match.team1_id) : null;
        const team2 = match.team2_id ? await ctx.db.get(match.team2_id) : null;

        return {
          _id: match._id,
          tournament_id: match.tournament_id,
          round: match.round,
          match_number: match.match_number,
          team1_id: match.team1_id,
          team2_id: match.team2_id,
          team1_name: team1?.team_name,
          team2_name: team2?.team_name,
          winner_team_id: match.winner_team_id,
          status: match.status,
          scheduled_time: match.scheduled_time,
          games: match.games,
          games_required: match.games_required,
          team1_games_won: match.team1_games_won,
          team2_games_won: match.team2_games_won,
        };
      })
    );

    return matchesWithTeams;
  },
});

/**
 * Get a single tournament match with details
 */
export const getTournamentMatch = query({
  args: {
    matchId: v.id("tournament_matches"),
  },
  returns: v.union(
    v.object({
      _id: v.id("tournament_matches"),
      tournament_id: v.id("tournaments"),
      round: v.number(),
      match_number: v.number(),
      team1_id: v.optional(v.id("teams")),
      team2_id: v.optional(v.id("teams")),
      team1_name: v.optional(v.string()),
      team2_name: v.optional(v.string()),
      winner_team_id: v.optional(v.id("teams")),
      status: v.union(
        v.literal("pending"),
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      scheduled_time: v.optional(v.number()),
      games: v.array(v.id("matches")),
      games_required: v.number(),
      team1_games_won: v.number(),
      team2_games_won: v.number(),
      tournament_name: v.string(),
      tournament_format: v.union(v.literal("round_robin"), v.literal("double_elim")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }

    const tournament = await ctx.db.get(match.tournament_id);
    const team1 = match.team1_id ? await ctx.db.get(match.team1_id) : null;
    const team2 = match.team2_id ? await ctx.db.get(match.team2_id) : null;

    return {
      _id: match._id,
      tournament_id: match.tournament_id,
      round: match.round,
      match_number: match.match_number,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      team1_name: team1?.team_name,
      team2_name: team2?.team_name,
      winner_team_id: match.winner_team_id,
      status: match.status,
      scheduled_time: match.scheduled_time,
      games: match.games,
      games_required: match.games_required,
      team1_games_won: match.team1_games_won,
      team2_games_won: match.team2_games_won,
      tournament_name: tournament?.name ?? "Unknown Tournament",
      tournament_format: tournament?.format ?? "round_robin",
    };
  },
});

/**
 * Get tournament standings for Round Robin format
 * Calculates wins, losses, games won/lost, and points for each team
 */
export const getTournamentStandings = query({
  args: {
    tournamentId: v.id("tournaments"),
  },
  returns: v.array(
    v.object({
      team_id: v.id("teams"),
      team_name: v.string(),
      team_elo: v.number(),
      matches_played: v.number(),
      matches_won: v.number(),
      matches_lost: v.number(),
      matches_pending: v.number(),
      games_won: v.number(),
      games_lost: v.number(),
      points: v.number(), // 3 points per match win, 1 for draw (if applicable)
    })
  ),
  handler: async (ctx, args) => {
    // Get all participants
    const participants = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    // Get all matches
    const matches = await ctx.db
      .query("tournament_matches")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    // Calculate standings for each team
    const standingsMap = new Map<
      string,
      {
        team_id: Id<"teams">;
        team_name: string;
        team_elo: number;
        matches_played: number;
        matches_won: number;
        matches_lost: number;
        matches_pending: number;
        games_won: number;
        games_lost: number;
        points: number;
      }
    >();

    // Initialize standings for all participants
    for (const participant of participants) {
      const team = await ctx.db.get(participant.team_id);
      if (team) {
        standingsMap.set(participant.team_id, {
          team_id: participant.team_id,
          team_name: team.team_name,
          team_elo: team.team_elo,
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          matches_pending: 0,
          games_won: 0,
          games_lost: 0,
          points: 0,
        });
      }
    }

    // Process each match
    for (const match of matches) {
      if (!match.team1_id || !match.team2_id) continue;

      const team1Stats = standingsMap.get(match.team1_id);
      const team2Stats = standingsMap.get(match.team2_id);

      if (!team1Stats || !team2Stats) continue;

      if (match.status === "completed") {
        // Update games won/lost
        team1Stats.games_won += match.team1_games_won;
        team1Stats.games_lost += match.team2_games_won;
        team2Stats.games_won += match.team2_games_won;
        team2Stats.games_lost += match.team1_games_won;

        // Update match stats
        team1Stats.matches_played++;
        team2Stats.matches_played++;

        if (match.winner_team_id === match.team1_id) {
          team1Stats.matches_won++;
          team1Stats.points += 3;
          team2Stats.matches_lost++;
        } else if (match.winner_team_id === match.team2_id) {
          team2Stats.matches_won++;
          team2Stats.points += 3;
          team1Stats.matches_lost++;
        }
      } else if (match.status === "pending" || match.status === "scheduled") {
        team1Stats.matches_pending++;
        team2Stats.matches_pending++;
      }
    }

    // Convert to array and sort by points (desc), then games won (desc)
    const standings = Array.from(standingsMap.values());
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.games_won !== a.games_won) return b.games_won - a.games_won;
      return (b.games_won - b.games_lost) - (a.games_won - a.games_lost);
    });

    return standings;
  },
});

/**
 * Get matches for a specific team in a tournament
 */
export const getTeamTournamentMatches = query({
  args: {
    tournamentId: v.id("tournaments"),
    teamId: v.id("teams"),
  },
  returns: v.array(
    v.object({
      _id: v.id("tournament_matches"),
      round: v.number(),
      match_number: v.number(),
      opponent_id: v.optional(v.id("teams")),
      opponent_name: v.optional(v.string()),
      is_team1: v.boolean(),
      status: v.union(
        v.literal("pending"),
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      team_games_won: v.number(),
      opponent_games_won: v.number(),
      is_winner: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("tournament_matches")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    // Filter matches involving this team
    const teamMatches = matches.filter(
      (m) => m.team1_id === args.teamId || m.team2_id === args.teamId
    );

    const result = await Promise.all(
      teamMatches.map(async (match) => {
        const isTeam1 = match.team1_id === args.teamId;
        const opponentId = isTeam1 ? match.team2_id : match.team1_id;
        const opponent = opponentId ? await ctx.db.get(opponentId) : null;

        return {
          _id: match._id,
          round: match.round,
          match_number: match.match_number,
          opponent_id: opponentId,
          opponent_name: opponent?.team_name,
          is_team1: isTeam1,
          status: match.status,
          team_games_won: isTeam1 ? match.team1_games_won : match.team2_games_won,
          opponent_games_won: isTeam1 ? match.team2_games_won : match.team1_games_won,
          is_winner: match.winner_team_id
            ? match.winner_team_id === args.teamId
            : undefined,
        };
      })
    );

    return result.sort((a, b) => a.round - b.round || a.match_number - b.match_number);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a game within a tournament match
 * This creates an actual game match that will be played in Minecraft
 */
export const createTournamentGame = mutation({
  args: {
    tournamentMatchId: v.id("tournament_matches"),
    matchType: v.string(),
    mode: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    matchId: v.optional(v.id("matches")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get tournament match
    const tournamentMatch = await ctx.db.get(args.tournamentMatchId);
    if (!tournamentMatch) {
      return { success: false, error: "Tournament match not found" };
    }

    // Check match status
    if (tournamentMatch.status === "completed" || tournamentMatch.status === "cancelled") {
      return { success: false, error: "Tournament match is already completed or cancelled" };
    }

    // Check if we've already reached the required games
    const totalGames = tournamentMatch.team1_games_won + tournamentMatch.team2_games_won;
    const maxGames = tournamentMatch.games_required * 2 - 1; // Best of N
    if (totalGames >= maxGames) {
      return { success: false, error: "Maximum games already played" };
    }

    // Check if match is already decided
    if (
      tournamentMatch.team1_games_won >= tournamentMatch.games_required ||
      tournamentMatch.team2_games_won >= tournamentMatch.games_required
    ) {
      return { success: false, error: "Tournament match is already decided" };
    }

    // Create game teams for this match
    const redTeamId = await ctx.db.insert("game_teams", { bots: [] });
    const blueTeamId = await ctx.db.insert("game_teams", { bots: [] });

    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes

    // Create the game match
    const matchId = await ctx.db.insert("matches", {
      match_type: args.matchType,
      match_status: "Queuing",
      blue_team_id: blueTeamId,
      red_team_id: redTeamId,
      mode: args.mode,
      expires_at: expiresAt,
    });

    // Update tournament match status and add game reference
    const updatedGames = [...tournamentMatch.games, matchId];
    await ctx.db.patch(args.tournamentMatchId, {
      status: "in_progress",
      games: updatedGames,
    });

    return { success: true, matchId };
  },
});

/**
 * Record game result and update tournament match
 * Called when a game within a tournament match completes
 */
export const recordGameResult = mutation({
  args: {
    tournamentMatchId: v.id("tournament_matches"),
    gameMatchId: v.id("matches"),
    winnerTeamNumber: v.union(v.literal(1), v.literal(2)), // 1 for team1, 2 for team2
  },
  returns: v.object({
    success: v.boolean(),
    tournamentMatchCompleted: v.boolean(),
    winnerId: v.optional(v.id("teams")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get tournament match
    const tournamentMatch = await ctx.db.get(args.tournamentMatchId);
    if (!tournamentMatch) {
      return { success: false, tournamentMatchCompleted: false, error: "Tournament match not found" };
    }

    // Verify game is part of this tournament match
    if (!tournamentMatch.games.includes(args.gameMatchId)) {
      return { success: false, tournamentMatchCompleted: false, error: "Game is not part of this tournament match" };
    }

    // Update game counts
    const newTeam1GamesWon =
      args.winnerTeamNumber === 1
        ? tournamentMatch.team1_games_won + 1
        : tournamentMatch.team1_games_won;
    const newTeam2GamesWon =
      args.winnerTeamNumber === 2
        ? tournamentMatch.team2_games_won + 1
        : tournamentMatch.team2_games_won;

    // Check if tournament match is decided
    const matchCompleted =
      newTeam1GamesWon >= tournamentMatch.games_required ||
      newTeam2GamesWon >= tournamentMatch.games_required;

    const winnerId = matchCompleted
      ? newTeam1GamesWon >= tournamentMatch.games_required
        ? tournamentMatch.team1_id
        : tournamentMatch.team2_id
      : undefined;

    // Update tournament match
    await ctx.db.patch(args.tournamentMatchId, {
      team1_games_won: newTeam1GamesWon,
      team2_games_won: newTeam2GamesWon,
      status: matchCompleted ? "completed" : "in_progress",
      winner_team_id: winnerId,
    });

    // If tournament match is complete, check if tournament should complete
    if (matchCompleted) {
      await checkTournamentCompletion(ctx, tournamentMatch.tournament_id);
    }

    return {
      success: true,
      tournamentMatchCompleted: matchCompleted,
      winnerId,
    };
  },
});

/**
 * Schedule a tournament match
 */
export const scheduleTournamentMatch = mutation({
  args: {
    matchId: v.id("tournament_matches"),
    scheduledTime: v.number(),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return { success: false, error: "Match not found" };
    }

    const tournament = await ctx.db.get(match.tournament_id);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Check permissions (tournament creator or admin)
    const isAdmin = await checkUserIsAdmin(ctx, args.userId);
    if (tournament.created_by !== args.userId && !isAdmin) {
      return { success: false, error: "Only tournament creator or admin can schedule matches" };
    }

    if (match.status !== "pending") {
      return { success: false, error: "Can only schedule pending matches" };
    }

    await ctx.db.patch(args.matchId, {
      scheduled_time: args.scheduledTime,
      status: "scheduled",
    });

    return { success: true };
  },
});

/**
 * Cancel a tournament match
 */
export const cancelTournamentMatch = mutation({
  args: {
    matchId: v.id("tournament_matches"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return { success: false, error: "Match not found" };
    }

    const tournament = await ctx.db.get(match.tournament_id);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    // Check permissions
    const isAdmin = await checkUserIsAdmin(ctx, args.userId);
    if (tournament.created_by !== args.userId && !isAdmin) {
      return { success: false, error: "Only tournament creator or admin can cancel matches" };
    }

    if (match.status === "completed") {
      return { success: false, error: "Cannot cancel a completed match" };
    }

    await ctx.db.patch(args.matchId, { status: "cancelled" });

    return { success: true };
  },
});

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Check if all matches in a tournament are complete and update tournament status
 */
async function checkTournamentCompletion(
  ctx: any,
  tournamentId: Id<"tournaments">
): Promise<void> {
  const matches = await ctx.db
    .query("tournament_matches")
    .withIndex("by_tournament_id", (q: any) =>
      q.eq("tournament_id", tournamentId)
    )
    .collect();

  const allCompleted = matches.every(
    (m: any) => m.status === "completed" || m.status === "cancelled"
  );

  if (allCompleted && matches.length > 0) {
    await ctx.db.patch(tournamentId, {
      status: "completed",
      end_time: Date.now(),
    });
  }
}
