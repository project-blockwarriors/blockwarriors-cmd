import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles table
  userProfiles: defineTable({
    userId: v.string(), // BetterAuth user ID
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    institution: v.union(v.string(), v.null()),
    geographicLocation: v.union(v.string(), v.null()),
    teamId: v.union(v.id("teams"), v.null()), // Reference to team in Convex
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_teamId", ["teamId"]),

  // Teams table
  teams: defineTable({
    teamName: v.string(),
    description: v.union(v.string(), v.null()),
    leaderId: v.string(), // BetterAuth user ID
    timeZone: v.union(v.string(), v.null()),
    teamElo: v.number(),
    teamWins: v.number(),
    teamLosses: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_leaderId", ["leaderId"])
    .index("by_teamElo", ["teamElo"]),

  // Settings table (singleton - only one document)
  settings: defineTable({
    startTournament: v.boolean(),
    showBanner: v.boolean(),
    bannerTextContent: v.union(v.string(), v.null()),
    bannerButtonContent: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  }),

  // Matches table
  matches: defineTable({
    matchType: v.string(),
    matchStatus: v.string(),
    matchElo: v.union(v.number(), v.null()),
    winnerTeamId: v.union(v.id("gameTeams"), v.null()),
    blueTeamId: v.id("gameTeams"),
    redTeamId: v.id("gameTeams"),
    mode: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_status", ["matchStatus"])
    .index("by_blueTeam", ["blueTeamId"])
    .index("by_redTeam", ["redTeamId"]),

  // Game tokens table
  gameTokens: defineTable({
    token: v.string(), // UUID string
    userId: v.union(v.string(), v.null()), // BetterAuth user ID
    matchId: v.id("matches"),
    gameTeamId: v.id("gameTeams"),
    botId: v.union(v.number(), v.null()),
    createdAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_matchId", ["matchId"])
    .index("by_gameTeamId", ["gameTeamId"])
    .index("by_userId", ["userId"]),

  // Game teams table
  gameTeams: defineTable({
    bots: v.array(v.number()),
    createdAt: v.number(),
  }),
});
