import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles table
  user_profiles: defineTable({
    user_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    institution: v.string(),
    geographic_location: v.string(),
    team_id: v.optional(v.id("teams")),
    updated_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_team_id", ["team_id"]),

  // Teams table
  teams: defineTable({
    team_name: v.string(),
    leader_id: v.string(),
    team_elo: v.number(),
    team_wins: v.number(),
    team_losses: v.number(),
    game_team_id: v.optional(v.string()),
  })
    .index("by_leaderId", ["leader_id"])
    .index("by_teamElo", ["team_elo"]),

  // Matches table
  matches: defineTable({
    match_type: v.string(),
    match_status: v.string(),
    match_elo: v.optional(v.number()),
    winner_team_id: v.optional(v.id("game_teams")),
    blue_team_id: v.id("game_teams"),
    red_team_id: v.id("game_teams"),
    mode: v.string(),
    expires_at: v.number(),
  }),

  // Game tokens table
  game_tokens: defineTable({
    token: v.string(),
    match_id: v.id("matches"),
    game_team_id: v.id("game_teams"),
    user_id: v.optional(v.string()),
    bot_id: v.optional(v.number()),
    created_at: v.number(),
    expires_at: v.number(),
    is_active: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_match_id", ["match_id"]),

  // Game teams table
  game_teams: defineTable({
    bots: v.array(v.number()),
  }),
});
