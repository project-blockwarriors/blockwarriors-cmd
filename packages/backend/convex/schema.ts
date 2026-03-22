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
    profile_image_id: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    minecraft_username: v.optional(v.string()),
    discord_username: v.optional(v.string()),
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
    team_image_id: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    created_at: v.optional(v.number()),
    disbanded_at: v.optional(v.number()), // Track when team was disbanded
  })
    .index("by_leader_id", ["leader_id"])
    .index("by_team_elo", ["team_elo"])
    .index("by_team_name", ["team_name"]),

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
    match_state: v.optional(v.any()),
  }).index("by_match_status", ["match_status"]),

  // Game tokens table
  game_tokens: defineTable({
    token: v.string(),
    match_id: v.id("matches"),
    game_team_id: v.id("game_teams"),
    user_id: v.optional(v.string()),
    ign: v.optional(v.string()), // In-Game Name (Minecraft username)
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

  // Settings table - stores application-wide configuration
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updated_at: v.number(),
  }).index("by_key", ["key"]),

  // Waitlist table - stores interest form submissions
  waitlist: defineTable({
    email: v.string(),
    name: v.string(),
    class_year: v.string(),
    degree_type: v.string(),
    created_at: v.number(),
  }).index("by_email", ["email"]),

  // Tournaments table - stores tournament configurations
  tournaments: defineTable({
    name: v.string(),
    description: v.string(),
    format: v.union(v.literal("round_robin"), v.literal("double_elim")),
    status: v.union(
      v.literal("registration"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    is_official: v.boolean(), // true = admin-created qualifiers/finals
    created_by: v.string(), // user_id of creator
    min_teams: v.number(),
    max_teams: v.number(),
    game_type: v.optional(v.string()), // pvp, bridge, ctf — determines match type for games
    games_per_match: v.number(), // for best-of-N (e.g., 1 for single game, 2 for best-of-3)
    registration_deadline: v.optional(v.number()),
    start_time: v.optional(v.number()),
    end_time: v.optional(v.number()),
    created_at: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_is_official", ["is_official"])
    .index("by_created_by", ["created_by"]),

  // Tournament participants table - tracks which teams joined which tournaments
  tournament_participants: defineTable({
    tournament_id: v.id("tournaments"),
    team_id: v.id("teams"),
    seed: v.optional(v.number()), // for seeding in brackets
    joined_at: v.number(),
  })
    .index("by_tournament_id", ["tournament_id"])
    .index("by_team_id", ["team_id"])
    .index("by_tournament_id_and_team_id", ["tournament_id", "team_id"]),

  // Tournament matches table - individual matches within a tournament
  tournament_matches: defineTable({
    tournament_id: v.id("tournaments"),
    round: v.number(), // round number (1, 2, 3, etc.)
    match_number: v.number(), // match number within the round
    team1_id: v.optional(v.id("teams")), // optional for byes
    team2_id: v.optional(v.id("teams")), // optional for byes
    winner_team_id: v.optional(v.id("teams")),
    status: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    scheduled_time: v.optional(v.number()),
    games: v.array(v.id("matches")), // references to individual game matches
    games_required: v.number(), // games needed to win (e.g., 2 for best-of-3)
    team1_games_won: v.number(), // track games won by team1
    team2_games_won: v.number(), // track games won by team2
  })
    .index("by_tournament_id", ["tournament_id"])
    .index("by_tournament_id_and_round", ["tournament_id", "round"])
    .index("by_tournament_id_and_status", ["tournament_id", "status"]),
});
