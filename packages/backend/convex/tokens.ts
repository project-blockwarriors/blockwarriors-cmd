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

    return {
      valid: true,
      matchId: tokenDoc.match_id,
      gameTeamId: tokenDoc.game_team_id,
      userId: tokenDoc.user_id,
    };
  },
});

// Get all tokens for a match
export const getTokensByMatchId = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("game_tokens")
      .withIndex("by_match_id", (q) => q.eq("match_id", args.matchId))
      .collect();

    return tokens.map((token) => ({
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
  },
});

// Check if a match is ready (all tokens have been used)
// A token is considered "used" if it has a user_id set (Minecraft UUID)
export const checkMatchReadiness = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return {
        ready: false,
        totalTokens: 0,
        usedTokens: 0,
        error: "Match not found",
      };
    }

    const tokens = await ctx.db
      .query("game_tokens")
      .withIndex("by_match_id", (q) => q.eq("match_id", args.matchId))
      .collect();

    if (tokens.length === 0) {
      return {
        ready: false,
        totalTokens: 0,
        usedTokens: 0,
        error: "No tokens found for match",
      };
    }

    // Count tokens that have been used (have user_id set)
    const usedTokens = tokens.filter(
      (token) => token.user_id !== undefined && token.user_id !== null
    );
    const totalTokens = tokens.length;
    const ready = usedTokens.length === totalTokens;

    // Group tokens by team
    const blueTeamTokens = tokens.filter(
      (token) => token.game_team_id === match.blue_team_id
    );
    const redTeamTokens = tokens.filter(
      (token) => token.game_team_id === match.red_team_id
    );

    return {
      ready,
      totalTokens,
      usedTokens: usedTokens.length,
      blueTeamTokens: blueTeamTokens.length,
      redTeamTokens: redTeamTokens.length,
      blueTeamUsed: blueTeamTokens.filter((t) => t.user_id).length,
      redTeamUsed: redTeamTokens.filter((t) => t.user_id).length,
    };
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

    // Mark token as used by storing playerId in user_id field and IGN
    // (user_id can store any string identifier, including Minecraft UUIDs)
    await ctx.db.patch(tokenDoc._id, {
      user_id: args.playerId,
      ign: args.ign ?? undefined,
    });

    return { success: true, matchId: tokenDoc.match_id };
  },
});
