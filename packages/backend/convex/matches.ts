import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { v4 as uuidv4 } from "uuid";

// Create a new match
export const createMatch = mutation({
  args: {
    matchType: v.string(),
    matchStatus: v.string(),
    blueTeamId: v.id("game_teams"),
    redTeamId: v.id("game_teams"),
    mode: v.string(),
    matchState: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    const matchId = await ctx.db.insert("matches", {
      match_type: args.matchType,
      match_status: args.matchStatus,
      blue_team_id: args.blueTeamId,
      red_team_id: args.redTeamId,
      mode: args.mode,
      expires_at: expiresAt,
      match_state: args.matchState ?? undefined,
    });

    return matchId;
  },
});

// Get match by ID
export const getMatchById = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }

    return {
      match_id: match._id,
      match_type: match.match_type,
      match_status: match.match_status,
      match_elo: match.match_elo,
      winner_team_id: match.winner_team_id,
      blue_team_id: match.blue_team_id,
      red_team_id: match.red_team_id,
      mode: match.mode,
      expires_at: match.expires_at,
      match_state: match.match_state,
    };
  },
});

// Get match with tokens and their IGNs for UI display
export const getMatchWithTokens = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }

    // Get all tokens for this match
    const tokens = await ctx.db
      .query("game_tokens")
      .withIndex("by_match_id", (q) => q.eq("match_id", args.matchId))
      .collect();

    // Group tokens by team
    const blueTeamTokens = tokens
      .filter((token) => token.game_team_id === match.blue_team_id)
      .map((token) => ({
        token: token.token,
        user_id: token.user_id,
        ign: token.ign,
        is_used: token.user_id !== undefined && token.user_id !== null,
      }));

    const redTeamTokens = tokens
      .filter((token) => token.game_team_id === match.red_team_id)
      .map((token) => ({
        token: token.token,
        user_id: token.user_id,
        ign: token.ign,
        is_used: token.user_id !== undefined && token.user_id !== null,
      }));

    return {
      match_id: match._id.toString(),
      match_type: match.match_type,
      match_status: match.match_status,
      blue_team_id: match.blue_team_id.toString(),
      red_team_id: match.red_team_id.toString(),
      mode: match.mode,
      expires_at: match.expires_at,
      match_state: match.match_state,
      tokens: {
        blueTeam: blueTeamTokens,
        redTeam: redTeamTokens,
      },
      totalTokens: tokens.length,
      usedTokens: tokens.filter(
        (t) => t.user_id !== undefined && t.user_id !== null
      ).length,
    };
  },
});

// Get match by token (finds match associated with a token)
export const getMatchByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("game_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc || !tokenDoc.is_active) {
      return null;
    }

    const match = await ctx.db.get(tokenDoc.match_id);
    if (!match) {
      return null;
    }

    return {
      match_id: match._id,
      match_type: match.match_type,
      match_status: match.match_status,
      match_elo: match.match_elo,
      winner_team_id: match.winner_team_id,
      blue_team_id: match.blue_team_id,
      red_team_id: match.red_team_id,
      mode: match.mode,
      expires_at: match.expires_at,
      match_state: match.match_state,
      game_team_id: tokenDoc.game_team_id,
    };
  },
});

// Valid match status values
const VALID_STATUSES = [
  "Queuing",
  "Waiting",
  "Playing",
  "Finished",
  "Terminated",
] as const;

// Validate status transition
function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  // Can't go backwards from terminal states
  if (currentStatus === "Finished" || currentStatus === "Terminated") {
    return false;
  }
  return VALID_STATUSES.includes(newStatus as any);
}

// Update match status
export const updateMatchStatus = mutation({
  args: {
    matchId: v.id("matches"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (!isValidStatusTransition(match.match_status, args.status)) {
      throw new Error(
        `Invalid status transition from ${match.match_status} to ${args.status}`
      );
    }

    await ctx.db.patch(args.matchId, {
      match_status: args.status,
    });
    return { success: true };
  },
});

// Update match state
export const updateMatchState = mutation({
  args: {
    matchId: v.id("matches"),
    matchState: v.any(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await ctx.db.patch(args.matchId, {
      match_state: args.matchState,
    });
    return { success: true };
  },
});

// Update match status and/or state
export const updateMatch = mutation({
  args: {
    matchId: v.id("matches"),
    matchStatus: v.optional(v.string()),
    matchState: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const updates: { match_status?: string; match_state?: any } = {};

    if (args.matchStatus !== undefined) {
      if (!isValidStatusTransition(match.match_status, args.matchStatus)) {
        throw new Error(
          `Invalid status transition from ${match.match_status} to ${args.matchStatus}`
        );
      }
      updates.match_status = args.matchStatus;
    }

    if (args.matchState !== undefined) {
      updates.match_state = args.matchState;
    }

    await ctx.db.patch(args.matchId, updates);
    return { success: true };
  },
});

// List matches by status
export const listMatchesByStatus = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matches = args.status
      ? await ctx.db
          .query("matches")
          .withIndex("by_match_status", (q) =>
            q.eq("match_status", args.status!)
          )
          .collect()
      : await ctx.db.query("matches").collect();

    return matches.map((match) => ({
      match_id: match._id,
      match_type: match.match_type,
      match_status: match.match_status,
      match_elo: match.match_elo,
      winner_team_id: match.winner_team_id,
      blue_team_id: match.blue_team_id,
      red_team_id: match.red_team_id,
      mode: match.mode,
      expires_at: match.expires_at,
      match_state: match.match_state,
    }));
  },
});

// Set match winner
export const setMatchWinner = mutation({
  args: {
    matchId: v.id("matches"),
    winnerTeamId: v.id("game_teams"),
    matchElo: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, {
      winner_team_id: args.winnerTeamId,
      match_status: "completed",
      match_elo: args.matchElo ?? undefined,
    });
    return { success: true };
  },
});

/**
 * Atomically create a match with game teams and tokens
 * This ensures all-or-nothing creation - if any step fails, nothing is created
 */
export const createMatchWithTokens = mutation({
  args: {
    matchType: v.string(),
    matchStatus: v.string(),
    mode: v.string(),
    userId: v.string(),
    tokensPerTeam: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    // Step 1: Create game teams (red and blue)
    // Using empty bot arrays for practice matches (can be configured later)
    const redTeamId = await ctx.db.insert("game_teams", {
      bots: [],
    });

    const blueTeamId = await ctx.db.insert("game_teams", {
      bots: [],
    });

    // Step 2: Create match
    const matchId = await ctx.db.insert("matches", {
      match_type: args.matchType,
      match_status: args.matchStatus,
      blue_team_id: blueTeamId,
      red_team_id: redTeamId,
      mode: args.mode,
      expires_at: expiresAt,
    });

    // Step 3: Generate tokens for both teams directly in this mutation
    // This ensures atomicity - all tokens are created in the same transaction
    const generateTokensForTeam = async (
      teamId: Id<"game_teams">,
      count: number
    ): Promise<string[]> => {
      const tokens: string[] = [];
      const tokenSet = new Set<string>();

      // Generate unique tokens upfront
      while (tokens.length < count) {
        const token = uuidv4();
        if (!tokenSet.has(token)) {
          tokenSet.add(token);
          tokens.push(token);
        }
      }

      // Check for existing tokens and regenerate if needed
      const finalTokens: string[] = [];
      for (const token of tokens) {
        const existing = await ctx.db
          .query("game_tokens")
          .withIndex("by_token", (q) => q.eq("token", token))
          .first();

        if (existing) {
          // Regenerate if collision (extremely rare with UUIDs)
          let newToken: string;
          let isUnique = false;
          let attempts = 0;
          while (!isUnique && attempts < 10) {
            newToken = uuidv4();
            const existingCheck = await ctx.db
              .query("game_tokens")
              .withIndex("by_token", (q) => q.eq("token", newToken))
              .first();

            if (!existingCheck && !finalTokens.includes(newToken)) {
              finalTokens.push(newToken);
              isUnique = true;
            }
            attempts++;
          }
          if (!isUnique) {
            throw new Error(
              `Failed to generate unique token after ${attempts} attempts`
            );
          }
        } else {
          finalTokens.push(token);
        }
      }

      // Insert all tokens for this team
      // Note: user_id should NOT be set here - it will be set when players log in with /login <token>
      // user_id stores the Minecraft UUID, not the Convex user ID
      for (const token of finalTokens) {
        const tokenData: Omit<Doc<"game_tokens">, "_id" | "_creationTime"> = {
          token: token,
          match_id: matchId,
          game_team_id: teamId,
          created_at: now,
          expires_at: expiresAt,
          is_active: true,
          // user_id is intentionally undefined - will be set when player logs in
        };

        await ctx.db.insert("game_tokens", tokenData);
      }

      return finalTokens;
    };

    // Generate tokens for red team
    const redTokens = await generateTokensForTeam(
      redTeamId,
      args.tokensPerTeam
    );

    // Generate tokens for blue team
    const blueTokens = await generateTokensForTeam(
      blueTeamId,
      args.tokensPerTeam
    );

    return {
      matchId: matchId,
      tokens: {
        redTeam: redTokens,
        blueTeam: blueTokens,
      },
      redTeamId: redTeamId,
      blueTeamId: blueTeamId,
      expiresAt: expiresAt,
    };
  },
});

/**
 * Atomically acknowledge a match and generate tokens
 * Called by Minecraft server when it acknowledges a queued match
 * Updates match status to "Waiting" and generates tokens for both teams
 */
export const acknowledgeMatchAndGenerateTokens = mutation({
  args: {
    matchId: v.id("matches"),
    tokensPerTeam: v.number(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Verify match is in "Queuing" status
    if (match.match_status !== "Queuing") {
      throw new Error(
        `Match is not in Queuing status. Current status: ${match.match_status}`
      );
    }

    const now = Date.now();
    const expiresAt = match.expires_at;

    // Generate tokens for both teams
    const generateTokensForTeam = async (
      teamId: Id<"game_teams">,
      count: number
    ): Promise<string[]> => {
      const tokens: string[] = [];
      const tokenSet = new Set<string>();

      // Generate unique tokens upfront
      while (tokens.length < count) {
        const token = uuidv4();
        if (!tokenSet.has(token)) {
          tokenSet.add(token);
          tokens.push(token);
        }
      }

      // Check for existing tokens and regenerate if needed
      const finalTokens: string[] = [];
      for (const token of tokens) {
        const existing = await ctx.db
          .query("game_tokens")
          .withIndex("by_token", (q) => q.eq("token", token))
          .first();

        if (existing) {
          // Regenerate if collision (extremely rare with UUIDs)
          let newToken: string;
          let isUnique = false;
          let attempts = 0;
          while (!isUnique && attempts < 10) {
            newToken = uuidv4();
            const existingCheck = await ctx.db
              .query("game_tokens")
              .withIndex("by_token", (q) => q.eq("token", newToken))
              .first();

            if (!existingCheck && !finalTokens.includes(newToken)) {
              finalTokens.push(newToken);
              isUnique = true;
            }
            attempts++;
          }
          if (!isUnique) {
            throw new Error(
              `Failed to generate unique token after ${attempts} attempts`
            );
          }
        } else {
          finalTokens.push(token);
        }
      }

      // Insert all tokens for this team
      for (const token of finalTokens) {
        const tokenData: Omit<Doc<"game_tokens">, "_id" | "_creationTime"> = {
          token: token,
          match_id: args.matchId,
          game_team_id: teamId,
          created_at: now,
          expires_at: expiresAt,
          is_active: true,
        };

        await ctx.db.insert("game_tokens", tokenData);
      }

      return finalTokens;
    };

    // Generate tokens for red team
    const redTokens = await generateTokensForTeam(
      match.red_team_id,
      args.tokensPerTeam
    );

    // Generate tokens for blue team
    const blueTokens = await generateTokensForTeam(
      match.blue_team_id,
      args.tokensPerTeam
    );

    // Update match status to "Waiting" atomically with token generation
    await ctx.db.patch(args.matchId, {
      match_status: "Waiting",
    });

    return {
      matchId: args.matchId,
      tokens: {
        redTeam: redTokens,
        blueTeam: blueTokens,
      },
      expiresAt: expiresAt,
    };
  },
});

/**
 * Archive matches that have been queued for more than 10 minutes
 * This prevents the Minecraft server from waiting on games that will never start
 * Internal mutation - called by cron job
 */
export const archiveOldQueuedMatches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000; // 10 minutes in milliseconds

    // Find all matches with status "Queuing"
    const queuedMatches = await ctx.db
      .query("matches")
      .withIndex("by_match_status", (q) => q.eq("match_status", "Queuing"))
      .collect();

    let archivedCount = 0;

    for (const match of queuedMatches) {
      // Check if match was created more than 10 minutes ago
      if (match._creationTime < tenMinutesAgo) {
        // Archive by setting status to "Terminated"
        // This is a valid status transition from "Queuing"
        await ctx.db.patch(match._id, {
          match_status: "Terminated",
        });
        archivedCount++;

        console.log(
          `Archived match ${match._id} (created ${Math.round(
            (now - match._creationTime) / 1000 / 60
          )} minutes ago)`
        );
      }
    }

    if (archivedCount > 0) {
      console.log(`Archived ${archivedCount} old queued match(es)`);
    }

    return { archivedCount };
  },
});
