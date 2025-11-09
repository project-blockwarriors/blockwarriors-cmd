import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a game team
export const createGameTeam = mutation({
  args: {
    bots: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const gameTeamId = await ctx.db.insert("game_teams", {
      bots: args.bots,
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

    const redTeamId = await ctx.db.insert("game_teams", {
      bots: args.redTeamBots,
    });

    const blueTeamId = await ctx.db.insert("game_teams", {
      bots: args.blueTeamBots,
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
    gameTeamId: v.id("game_teams"),
  },
  handler: async (ctx, args) => {
    const gameTeam = await ctx.db.get(args.gameTeamId);
    if (!gameTeam) {
      return null;
    }

    return {
      game_team_id: gameTeam._id,
      bots: gameTeam.bots,
    };
  },
});


