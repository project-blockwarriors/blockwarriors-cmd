import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create a game team
export const createGameTeam = mutation({
  args: {
    bots: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const gameTeamId = await ctx.db.insert("gameTeams", {
      bots: args.bots,
      createdAt: now,
    });

    return gameTeamId;
  },
});

// Create game teams for a match (typically red and blue)
export const createGameTeamsForMatch = mutation({
  args: {
    redTeamBots: v.array(v.number()),
    blueTeamBots: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const redTeamId = await ctx.db.insert("gameTeams", {
      bots: args.redTeamBots,
      createdAt: now,
    });

    const blueTeamId = await ctx.db.insert("gameTeams", {
      bots: args.blueTeamBots,
      createdAt: now,
    });

    return {
      redTeamId,
      blueTeamId,
    };
  },
});

// Get game team by ID
export const getGameTeamById = query({
  args: {
    gameTeamId: v.id("gameTeams"),
  },
  handler: async (ctx, args) => {
    const gameTeam = await ctx.db.get(args.gameTeamId);
    if (!gameTeam) {
      return null;
    }

    return {
      game_team_id: gameTeam._id,
      bots: gameTeam.bots,
      created_at: gameTeam.createdAt,
    };
  },
});


