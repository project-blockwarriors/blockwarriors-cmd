import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Validate token and return match info
export const validateToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("game_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      return { valid: false, error: "Token not found" };
    }

    if (!tokenDoc.is_active) {
      return { valid: false, error: "Token is not active" };
    }

    const now = Date.now();
    if (tokenDoc.expires_at < now) {
      return { valid: false, error: "Token has expired" };
    }

    // Check if token has already been used by another player
    if (tokenDoc.user_id !== undefined && tokenDoc.user_id !== null) {
      return { valid: false, error: "Token has already been used" };
    }

    return {
      valid: true,
      matchId: tokenDoc.match_id,
      gameTeamId: tokenDoc.game_team_id,
      userId: tokenDoc.user_id,
    };
  },
});

/**
 * Get tokens for one or more matches.
 * Accepts an array of match IDs and returns tokens grouped by match ID.
 */
export const getTokens = query({
  args: {
    matchIds: v.array(v.id("matches")),
  },
  handler: async (ctx, args) => {
    const results: Record<
      string,
      Array<{
        token_id: string;
        token: string;
        user_id?: string;
        ign?: string;
        match_id: string;
        game_team_id: string;
        bot_id?: string;
        created_at: number;
        expires_at: number;
        is_active: boolean;
      }>
    > = {};

    for (const matchId of args.matchIds) {
      const tokens = await ctx.db
        .query("game_tokens")
        .withIndex("by_match_id", (q) => q.eq("match_id", matchId))
        .collect();

      results[matchId] = tokens.map((token) => ({
        token_id: token._id,
        token: token.token,
        user_id: token.user_id,
        ign: token.ign,
        match_id: token.match_id,
        game_team_id: token.game_team_id,
        bot_id: token.bot_id,
        created_at: token.created_at,
        expires_at: token.expires_at,
        is_active: token.is_active,
      }));
    }

    return results;
  },
});

/**
 * Check readiness for one or more matches.
 * A match is ready when all tokens have been used (have user_id set).
 * Accepts an array of match IDs and returns readiness info for each.
 */
export const checkReadiness = query({
  args: {
    matchIds: v.array(v.id("matches")),
  },
  handler: async (ctx, args) => {
    const results: Record<
      string,
      {
        ready: boolean;
        totalTokens: number;
        usedTokens: number;
        error?: string;
      }
    > = {};

    for (const matchId of args.matchIds) {
      const match = await ctx.db.get(matchId);
      if (!match) {
        results[matchId] = {
          ready: false,
          totalTokens: 0,
          usedTokens: 0,
          error: "Match not found",
        };
        continue;
      }

      const tokens = await ctx.db
        .query("game_tokens")
        .withIndex("by_match_id", (q) => q.eq("match_id", matchId))
        .collect();

      if (tokens.length === 0) {
        results[matchId] = {
          ready: false,
          totalTokens: 0,
          usedTokens: 0,
          error: "No tokens found for match",
        };
        continue;
      }

      const usedTokens = tokens.filter(
        (token) => token.user_id !== undefined && token.user_id !== null
      );
      const totalTokens = tokens.length;
      const ready = usedTokens.length === totalTokens;

      results[matchId] = {
        ready,
        totalTokens,
        usedTokens: usedTokens.length,
      };
    }

    return results;
  },
});

// Mark a token as used by a player (Minecraft UUID)
// This is called when a player successfully logs in with a token
export const markTokenAsUsed = mutation({
  args: {
    token: v.string(),
    playerId: v.string(), // Minecraft UUID
    ign: v.optional(v.string()), // In-Game Name (Minecraft username)
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("game_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      throw new Error("Token not found");
    }

    if (!tokenDoc.is_active) {
      throw new Error("Token is not active");
    }

    const now = Date.now();
    if (tokenDoc.expires_at < now) {
      throw new Error("Token has expired");
    }

    // Check if token has already been used by another player (prevents race condition)
    if (tokenDoc.user_id !== undefined && tokenDoc.user_id !== null) {
      throw new Error("Token has already been used");
    }

    // Mark token as used by storing playerId in user_id field and IGN
    // (user_id can store any string identifier, including Minecraft UUIDs)
    await ctx.db.patch(tokenDoc._id, {
      user_id: args.playerId,
      ign: args.ign ?? undefined,
    });

    return { success: true, matchId: tokenDoc.match_id };
  },
});

// Clear token usage when a player disconnects before match starts
// Only clears if match is in "Waiting" status - Convex handles the status check
// This allows the token to be reused by the same player or another player
export const clearTokenUsage = mutation({
  args: {
    playerId: v.string(), // Minecraft UUID
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    // Get the match and check status
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return { success: false, error: "Match not found" };
    }

    // Only clear tokens if match is in "Waiting" status
    if (match.match_status !== "Waiting") {
      return {
        success: false,
        error: `Cannot clear token: match is in ${match.match_status} status`,
      };
    }

    // Find the token used by this player in this match
    const tokens = await ctx.db
      .query("game_tokens")
      .withIndex("by_match_id", (q) => q.eq("match_id", args.matchId))
      .collect();

    const playerToken = tokens.find((t) => t.user_id === args.playerId);

    if (!playerToken) {
      return {
        success: false,
        error: "No token found for player in this match",
      };
    }

    // Clear the user_id and ign so token can be reused
    await ctx.db.patch(playerToken._id, {
      user_id: undefined,
      ign: undefined,
    });

    return { success: true };
  },
});

// Deactivate all tokens for a match
// Called when a match ends (Finished or Terminated)
export const deactivateMatchTokens = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("game_tokens")
      .withIndex("by_match_id", (q) => q.eq("match_id", args.matchId))
      .collect();

    let deactivatedCount = 0;
    for (const token of tokens) {
      if (token.is_active) {
        await ctx.db.patch(token._id, {
          is_active: false,
        });
        deactivatedCount++;
      }
    }

    return { success: true, deactivatedCount };
  },
});
