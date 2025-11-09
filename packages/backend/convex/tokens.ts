import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "../_generated/dataModel";
import { v4 as uuidv4 } from "uuid";

// Create a single token
export const createToken = mutation({
  args: {
    token: v.string(), // UUID string
    userId: v.union(v.string(), v.null()),
    matchId: v.id("matches"),
    gameTeamId: v.id("game_teams"),
    botId: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    // Check if token already exists
    const existing = await ctx.db
      .query("game_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      throw new Error("Token already exists");
    }

    const tokenData: Omit<Doc<"game_tokens">, "_id" | "_creationTime"> = {
      token: args.token,
      match_id: args.matchId,
      game_team_id: args.gameTeamId,
      created_at: now,
      expires_at: expiresAt,
      is_active: true,
      user_id: args.userId ?? undefined,
      bot_id: args.botId ?? undefined,
    };
    
    const tokenId = await ctx.db.insert("game_tokens", tokenData);

    return tokenId;
  },
});

// Create multiple tokens for a match
export const createTokensForMatch = mutation({
  args: {
    tokens: v.array(v.string()), // Array of UUID strings
    userId: v.union(v.string(), v.null()),
    matchId: v.id("matches"),
    gameTeamId: v.id("game_teams"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    const tokenIds = [];
    for (const token of args.tokens) {
      // Check if token already exists
      const existing = await ctx.db
        .query("game_tokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      if (!existing) {
        const tokenData: Omit<Doc<"game_tokens">, "_id" | "_creationTime"> = {
          token: token,
          match_id: args.matchId,
          game_team_id: args.gameTeamId,
          created_at: now,
          expires_at: expiresAt,
          is_active: true,
          user_id: args.userId ?? undefined,
        };
        
        const tokenId = await ctx.db.insert("game_tokens", tokenData);
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

// Get token by value
export const getTokenByValue = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query("game_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      return null;
    }

    return {
      token_id: tokenDoc._id,
      token: tokenDoc.token,
      user_id: tokenDoc.user_id,
      match_id: tokenDoc.match_id,
      game_team_id: tokenDoc.game_team_id,
      bot_id: tokenDoc.bot_id,
      created_at: tokenDoc.created_at,
      expires_at: tokenDoc.expires_at,
      is_active: tokenDoc.is_active,
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
      match_id: token.match_id,
      game_team_id: token.game_team_id,
      bot_id: token.bot_id,
      created_at: token.created_at,
      expires_at: token.expires_at,
      is_active: token.is_active,
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
      .query("game_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) {
      throw new Error("Token not found");
    }

    await ctx.db.patch(tokenDoc._id, {
      is_active: false,
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
    gameTeamId: v.id("game_teams"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    // Generate unique tokens upfront
    const tokens: string[] = [];
    const tokenSet = new Set<string>();
    
    // Generate tokens until we have enough unique ones
    while (tokens.length < args.count) {
      const token = uuidv4();
      if (!tokenSet.has(token)) {
        tokenSet.add(token);
        tokens.push(token);
      }
    }

    // Check for existing tokens and filter them out
    const existingTokens = new Set<string>();
    for (const token of tokens) {
      const existing = await ctx.db
        .query("game_tokens")
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
          newToken = uuidv4();
          const existing = await ctx.db
            .query("game_tokens")
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
    const tokenIds: Id<"game_tokens">[] = [];
    for (const token of finalTokens) {
      const tokenData: Omit<Doc<"game_tokens">, "_id" | "_creationTime"> = {
        token: token,
        match_id: args.matchId,
        game_team_id: args.gameTeamId,
        created_at: now,
        expires_at: expiresAt,
        is_active: true,
        user_id: args.userId ?? undefined,
      };
      
      const tokenId = await ctx.db.insert("game_tokens", tokenData);
      tokenIds.push(tokenId);
    }

    return {
      tokens: finalTokens,
      tokenIds: tokenIds,
    };
  },
});

