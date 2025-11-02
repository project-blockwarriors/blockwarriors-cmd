import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import * as crypto from "crypto";

// Create a single token
export const createToken = mutation({
  args: {
    token: v.string(), // UUID string
    userId: v.union(v.string(), v.null()),
    matchId: v.id("matches"),
    gameTeamId: v.id("gameTeams"),
    botId: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    // Check if token already exists
    const existing = await ctx.db
      .query("gameTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      throw new Error("Token already exists");
    }

    const tokenId = await ctx.db.insert("gameTokens", {
      token: args.token,
      userId: args.userId,
      matchId: args.matchId,
      gameTeamId: args.gameTeamId,
      botId: args.botId,
      createdAt: now,
      expiresAt: expiresAt,
      isActive: true,
    });

    return tokenId;
  },
});

// Create multiple tokens for a match
export const createTokensForMatch = mutation({
  args: {
    tokens: v.array(v.string()), // Array of UUID strings
    userId: v.union(v.string(), v.null()),
    matchId: v.id("matches"),
    gameTeamId: v.id("gameTeams"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    const tokenIds = [];
    for (const token of args.tokens) {
      // Check if token already exists
      const existing = await ctx.db
        .query("gameTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      if (!existing) {
        const tokenId = await ctx.db.insert("gameTokens", {
          token: token,
          userId: args.userId,
          matchId: args.matchId,
          gameTeamId: args.gameTeamId,
          botId: null,
          createdAt: now,
          expiresAt: expiresAt,
          isActive: true,
        });
        tokenIds.push(tokenId);
      }
    }

    return tokenIds;
  },
});

// Validate token and return match info
export const validateToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("gameTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      return { valid: false, error: "Token not found" };
    }

    if (!tokenDoc.isActive) {
      return { valid: false, error: "Token is not active" };
    }

    const now = Date.now();
    if (tokenDoc.expiresAt < now) {
      return { valid: false, error: "Token has expired" };
    }

    return {
      valid: true,
      matchId: tokenDoc.matchId,
      gameTeamId: tokenDoc.gameTeamId,
      userId: tokenDoc.userId,
    };
  },
});

// Get token by value
export const getTokenByValue = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("gameTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      return null;
    }

    return {
      token_id: tokenDoc._id,
      token: tokenDoc.token,
      user_id: tokenDoc.userId,
      match_id: tokenDoc.matchId,
      game_team_id: tokenDoc.gameTeamId,
      bot_id: tokenDoc.botId,
      created_at: tokenDoc.createdAt,
      expires_at: tokenDoc.expiresAt,
      is_active: tokenDoc.isActive,
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
      .query("gameTokens")
      .withIndex("by_matchId", (q) => q.eq("matchId", args.matchId))
      .collect();

    return tokens.map((token) => ({
      token_id: token._id,
      token: token.token,
      user_id: token.userId,
      match_id: token.matchId,
      game_team_id: token.gameTeamId,
      bot_id: token.botId,
      created_at: token.createdAt,
      expires_at: token.expiresAt,
      is_active: token.isActive,
    }));
  },
});

// Deactivate a token
export const deactivateToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("gameTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      throw new Error("Token not found");
    }

    await ctx.db.patch(tokenDoc._id, {
      isActive: false,
    });

    return { success: true };
  },
});

/**
 * Generate a batch of unique tokens for a match
 * This function generates tokens upfront and inserts them in batch
 * Returns the generated token strings
 */
export const generateTokenBatch = mutation({
  args: {
    count: v.number(),
    userId: v.union(v.string(), v.null()),
    matchId: v.id("matches"),
    gameTeamId: v.id("gameTeams"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    // Generate unique tokens upfront
    const tokens: string[] = [];
    const tokenSet = new Set<string>();
    
    // Generate tokens until we have enough unique ones
    while (tokens.length < args.count) {
      const token = crypto.randomUUID();
      if (!tokenSet.has(token)) {
        tokenSet.add(token);
        tokens.push(token);
      }
    }

    // Check for existing tokens and filter them out
    const existingTokens = new Set<string>();
    for (const token of tokens) {
      const existing = await ctx.db
        .query("gameTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      
      if (existing) {
        existingTokens.add(token);
      }
    }

    // If any tokens already exist, regenerate them
    const finalTokens: string[] = [];
    for (const token of tokens) {
      if (existingTokens.has(token)) {
        // Regenerate if collision
        let newToken: string;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          newToken = crypto.randomUUID();
          const existing = await ctx.db
            .query("gameTokens")
            .withIndex("by_token", (q) => q.eq("token", newToken))
            .first();
          
          if (!existing && !finalTokens.includes(newToken)) {
            finalTokens.push(newToken);
            isUnique = true;
          }
          attempts++;
        }
        if (!isUnique) {
          throw new Error(`Failed to generate unique token after ${attempts} attempts`);
        }
      } else {
        finalTokens.push(token);
      }
    }

    // Batch insert all tokens
    const tokenIds: Id<"gameTokens">[] = [];
    for (const token of finalTokens) {
      const tokenId = await ctx.db.insert("gameTokens", {
        token: token,
        userId: args.userId,
        matchId: args.matchId,
        gameTeamId: args.gameTeamId,
        botId: null,
        createdAt: now,
        expiresAt: expiresAt,
        isActive: true,
      });
      tokenIds.push(tokenId);
    }

    return {
      tokens: finalTokens,
      tokenIds: tokenIds,
    };
  },
});

