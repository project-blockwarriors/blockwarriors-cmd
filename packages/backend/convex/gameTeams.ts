import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a game team
export const createGameTeam = mutation({
  args: {
    bots: v.array(v.number()),
  },
  handler: async (ctx, args) => {
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

