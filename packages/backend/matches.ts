import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { v4 as uuidv4 } from "uuid";

// Create a new match
export const createMatch = mutation({
  args: {
    matchType: v.string(),
    matchStatus: v.string(),
    blueTeamId: v.id("gameTeams"),
    redTeamId: v.id("gameTeams"),
    mode: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    const matchId = await ctx.db.insert("matches", {
      matchType: args.matchType,
      matchStatus: args.matchStatus,
      matchElo: null,
      winnerTeamId: null,
      blueTeamId: args.blueTeamId,
      redTeamId: args.redTeamId,
      mode: args.mode,
      createdAt: now,
      expiresAt: expiresAt,
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
      match_type: match.matchType,
      match_status: match.matchStatus,
      match_elo: match.matchElo,
      winner_team_id: match.winnerTeamId,
      blue_team_id: match.blueTeamId,
      red_team_id: match.redTeamId,
      mode: match.mode,
      created_at: match.createdAt,
      expires_at: match.expiresAt,
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
      .query("gameTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc || !tokenDoc.isActive) {
      return null;
    }

    const match = await ctx.db.get(tokenDoc.matchId);
    if (!match) {
      return null;
    }

    return {
      match_id: match._id,
      match_type: match.matchType,
      match_status: match.matchStatus,
      match_elo: match.matchElo,
      winner_team_id: match.winnerTeamId,
      blue_team_id: match.blueTeamId,
      red_team_id: match.redTeamId,
      mode: match.mode,
      created_at: match.createdAt,
      expires_at: match.expiresAt,
      game_team_id: tokenDoc.gameTeamId,
    };
  },
});

// Update match status
export const updateMatchStatus = mutation({
  args: {
    matchId: v.id("matches"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, {
      matchStatus: args.status,
    });
    return { success: true };
  },
});

// Set match winner
export const setMatchWinner = mutation({
  args: {
    matchId: v.id("matches"),
    winnerTeamId: v.id("gameTeams"),
    matchElo: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, {
      winnerTeamId: args.winnerTeamId,
      matchStatus: "completed",
      matchElo: args.matchElo,
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
    userId: v.union(v.string(), v.null()),
    tokensPerTeam: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now

    // Step 1: Create game teams (red and blue)
    // Using empty bot arrays for practice matches (can be configured later)
    const redTeamId = await ctx.db.insert("gameTeams", {
      bots: [],
      createdAt: now,
    });

    const blueTeamId = await ctx.db.insert("gameTeams", {
      bots: [],
      createdAt: now,
    });

    // Step 2: Create match
    const matchId = await ctx.db.insert("matches", {
      matchType: args.matchType,
      matchStatus: args.matchStatus,
      matchElo: null,
      winnerTeamId: null,
      blueTeamId: blueTeamId,
      redTeamId: redTeamId,
      mode: args.mode,
      createdAt: now,
      expiresAt: expiresAt,
    });

    // Step 3: Generate tokens for both teams directly in this mutation
    // This ensures atomicity - all tokens are created in the same transaction
    const generateTokensForTeam = async (
      teamId: Id<"gameTeams">,
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
          .query("gameTokens")
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
              .query("gameTokens")
              .withIndex("by_token", (q) => q.eq("token", newToken))
              .first();
            
            if (!existingCheck && !finalTokens.includes(newToken)) {
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

      // Insert all tokens for this team
      for (const token of finalTokens) {
        await ctx.db.insert("gameTokens", {
          token: token,
          userId: args.userId,
          matchId: matchId,
          gameTeamId: teamId,
          botId: null,
          createdAt: now,
          expiresAt: expiresAt,
          isActive: true,
        });
      }

      return finalTokens;
    };

    // Generate tokens for red team
    const redTokens = await generateTokensForTeam(redTeamId, args.tokensPerTeam);

    // Generate tokens for blue team
    const blueTokens = await generateTokensForTeam(blueTeamId, args.tokensPerTeam);

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

