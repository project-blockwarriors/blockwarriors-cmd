/**
 * Development Seed Data
 * 
 * This file contains mutations for seeding the database with test data.
 * All functions use `internalMutation` so they can only be run manually
 * via the Convex dashboard (Functions tab).
 * 
 * IMPORTANT: These are for DEVELOPMENT USE ONLY. Never run in production.
 * 
 * Usage:
 * 1. Open Convex Dashboard
 * 2. Go to Functions tab
 * 3. Find seed:seedAll (or individual seed functions)
 * 4. Click "Run" to execute
 * 
 * Available seed functions:
 * - seedAll: Seeds everything (recommended for fresh start)
 * - seedUsers: Seeds user profiles only
 * - seedTeams: Seeds teams only (requires users)
 * - seedTournaments: Seeds tournaments only (requires teams)
 * - clearAll: Clears all seeded data (use with caution!)
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CONSTANTS & MOCK DATA
// ============================================================================

/**
 * Mock user data - represents different types of participants
 * These use fake user IDs since we can't create real auth users
 */
const MOCK_USERS = [
  { id: "user_seed_001", firstName: "Alex", lastName: "Chen", institution: "Princeton University", location: "Princeton, NJ" },
  { id: "user_seed_002", firstName: "Jordan", lastName: "Smith", institution: "Princeton University", location: "Princeton, NJ" },
  { id: "user_seed_003", firstName: "Taylor", lastName: "Williams", institution: "MIT", location: "Cambridge, MA" },
  { id: "user_seed_004", firstName: "Morgan", lastName: "Davis", institution: "Stanford University", location: "Palo Alto, CA" },
  { id: "user_seed_005", firstName: "Casey", lastName: "Johnson", institution: "Harvard University", location: "Cambridge, MA" },
  { id: "user_seed_006", firstName: "Riley", lastName: "Brown", institution: "Yale University", location: "New Haven, CT" },
  { id: "user_seed_007", firstName: "Quinn", lastName: "Miller", institution: "Columbia University", location: "New York, NY" },
  { id: "user_seed_008", firstName: "Avery", lastName: "Wilson", institution: "UPenn", location: "Philadelphia, PA" },
  { id: "user_seed_009", firstName: "Drew", lastName: "Moore", institution: "Cornell University", location: "Ithaca, NY" },
  { id: "user_seed_010", firstName: "Jamie", lastName: "Taylor", institution: "Dartmouth College", location: "Hanover, NH" },
  { id: "user_seed_011", firstName: "Sam", lastName: "Anderson", institution: "Brown University", location: "Providence, RI" },
  { id: "user_seed_012", firstName: "Blake", lastName: "Thomas", institution: "Princeton University", location: "Princeton, NJ" },
  { id: "user_seed_013", firstName: "Parker", lastName: "Jackson", institution: "MIT", location: "Cambridge, MA" },
  { id: "user_seed_014", firstName: "Reese", lastName: "White", institution: "Stanford University", location: "Palo Alto, CA" },
  { id: "user_seed_015", firstName: "Skyler", lastName: "Harris", institution: "Caltech", location: "Pasadena, CA" },
  { id: "user_seed_016", firstName: "Dakota", lastName: "Martin", institution: "UC Berkeley", location: "Berkeley, CA" },
] as const;

/**
 * Mock team configurations
 * Each team has a name, leader (by user index), member indices, and stats
 */
const MOCK_TEAMS = [
  { name: "Dragon Slayers", leaderIdx: 0, memberIdxs: [0, 1], elo: 1850, wins: 12, losses: 3 },
  { name: "Nether Knights", leaderIdx: 2, memberIdxs: [2, 3], elo: 1720, wins: 10, losses: 5 },
  { name: "Emerald Warriors", leaderIdx: 4, memberIdxs: [4, 5], elo: 1680, wins: 8, losses: 6 },
  { name: "Redstone Masters", leaderIdx: 6, memberIdxs: [6, 7], elo: 1550, wins: 7, losses: 7 },
  { name: "Diamond Defenders", leaderIdx: 8, memberIdxs: [8, 9], elo: 1500, wins: 6, losses: 8 },
  { name: "Obsidian Legion", leaderIdx: 10, memberIdxs: [10, 11], elo: 1420, wins: 5, losses: 9 },
  { name: "Creeper Squad", leaderIdx: 12, memberIdxs: [12, 13], elo: 1380, wins: 4, losses: 10 },
  { name: "Enderman Elite", leaderIdx: 14, memberIdxs: [14, 15], elo: 1200, wins: 2, losses: 12 },
] as const;

/**
 * Tournament configurations
 * Designed to test various edge cases and UI states
 */
const MOCK_TOURNAMENTS = {
  // Tournament needing 1 more team to hit minimum (4 min, 3 registered)
  almostMinimum: {
    name: "Spring Qualifiers 2026",
    description: "Official qualifier tournament for the Spring Championship. Round robin format with top 4 advancing.",
    format: "round_robin" as const,
    isOfficial: true,
    minTeams: 4,
    maxTeams: 8,
    gamesPerMatch: 1,
    participantCount: 3, // Need 1 more to start!
  },
  // Tournament needing 1 more team to hit maximum (8 max, 7 registered)
  almostFull: {
    name: "Community Cup #5",
    description: "Community-organized tournament open to all teams. Join before spots fill up!",
    format: "round_robin" as const,
    isOfficial: false,
    minTeams: 4,
    maxTeams: 8,
    gamesPerMatch: 2, // Best of 3
    participantCount: 7, // Only 1 spot left!
  },
  // Tournament in progress with matches
  inProgress: {
    name: "Winter Championship Qualifiers",
    description: "The official Winter Championship qualifier. Top performers advance to the finals.",
    format: "round_robin" as const,
    isOfficial: true,
    minTeams: 4,
    maxTeams: 6,
    gamesPerMatch: 1,
    participantCount: 4,
  },
  // Completed tournament
  completed: {
    name: "Fall Invitational 2025",
    description: "The inaugural BlockWarriors invitational tournament.",
    format: "round_robin" as const,
    isOfficial: true,
    minTeams: 4,
    maxTeams: 8,
    gamesPerMatch: 1,
    participantCount: 4,
  },
  // Tournament open for registration (plenty of space)
  openRegistration: {
    name: "Practice Tournament #1",
    description: "Casual practice tournament for teams to get experience. No stakes, just fun!",
    format: "round_robin" as const,
    isOfficial: false,
    minTeams: 2,
    maxTeams: 16,
    gamesPerMatch: 1,
    participantCount: 2,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a deterministic "random" number based on seed
 * Useful for creating varied but reproducible test data
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Get timestamp for N days ago
 */
function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Get timestamp for N days from now
 */
function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

// ============================================================================
// SEED MUTATIONS
// ============================================================================

/**
 * Seeds all mock users into the database
 * Creates user_profiles for testing
 */
export const seedUsers = internalMutation({
  args: {},
  returns: v.object({
    created: v.number(),
    userIds: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const userIds: string[] = [];
    const now = Date.now();

    for (const user of MOCK_USERS) {
      // Check if user already exists
      const existing = await ctx.db
        .query("user_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", user.id))
        .first();

      if (!existing) {
        await ctx.db.insert("user_profiles", {
          user_id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          institution: user.institution,
          geographic_location: user.location,
          updated_at: now,
        });
        userIds.push(user.id);
      }
    }

    return { created: userIds.length, userIds };
  },
});

/**
 * Seeds all mock teams into the database
 * Requires users to be seeded first
 */
export const seedTeams = internalMutation({
  args: {},
  returns: v.object({
    created: v.number(),
    teamIds: v.array(v.id("teams")),
  }),
  handler: async (ctx) => {
    const teamIds: Id<"teams">[] = [];
    const now = Date.now();

    for (const team of MOCK_TEAMS) {
      // Check if team already exists
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_team_name", (q) => q.eq("team_name", team.name))
        .first();

      if (existing) {
        teamIds.push(existing._id);
        continue;
      }

      const leaderId = MOCK_USERS[team.leaderIdx].id;

      // Create the team
      const teamId = await ctx.db.insert("teams", {
        team_name: team.name,
        leader_id: leaderId,
        team_elo: team.elo,
        team_wins: team.wins,
        team_losses: team.losses,
      });

      // Update all team members to be part of this team
      for (const memberIdx of team.memberIdxs) {
        const userId = MOCK_USERS[memberIdx].id;
        const profile = await ctx.db
          .query("user_profiles")
          .withIndex("by_user_id", (q) => q.eq("user_id", userId))
          .first();

        if (profile) {
          await ctx.db.patch(profile._id, {
            team_id: teamId,
            updated_at: now,
          });
        }
      }

      teamIds.push(teamId);
    }

    return { created: teamIds.length, teamIds };
  },
});

/**
 * Seeds tournaments with various states for testing
 * Requires teams to be seeded first
 */
export const seedTournaments = internalMutation({
  args: {},
  returns: v.object({
    created: v.number(),
    tournaments: v.array(
      v.object({
        id: v.id("tournaments"),
        name: v.string(),
        status: v.string(),
        participantCount: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    const results: Array<{
      id: Id<"tournaments">;
      name: string;
      status: string;
      participantCount: number;
    }> = [];
    const now = Date.now();
    const adminUserId = MOCK_USERS[0].id; // First user acts as admin for official tournaments

    // Get all team IDs
    const allTeams = await ctx.db.query("teams").collect();
    if (allTeams.length < 4) {
      throw new Error("Not enough teams seeded. Run seedTeams first.");
    }

    // Helper to add participants to a tournament
    const addParticipants = async (
      tournamentId: Id<"tournaments">,
      count: number
    ) => {
      for (let i = 0; i < count && i < allTeams.length; i++) {
        const existing = await ctx.db
          .query("tournament_participants")
          .withIndex("by_tournament_id_and_team_id", (q) =>
            q.eq("tournament_id", tournamentId).eq("team_id", allTeams[i]._id)
          )
          .first();

        if (!existing) {
          await ctx.db.insert("tournament_participants", {
            tournament_id: tournamentId,
            team_id: allTeams[i]._id,
            seed: i + 1,
            joined_at: daysAgo(Math.floor(seededRandom(i) * 10)),
          });
        }
      }
    };

    // 1. Tournament needing 1 more team to hit minimum
    const almostMin = MOCK_TOURNAMENTS.almostMinimum;
    let existingTournament = await ctx.db
      .query("tournaments")
      .filter((q) => q.eq(q.field("name"), almostMin.name))
      .first();

    if (!existingTournament) {
      const tournamentId = await ctx.db.insert("tournaments", {
        name: almostMin.name,
        description: almostMin.description,
        format: almostMin.format,
        status: "registration",
        is_official: almostMin.isOfficial,
        created_by: adminUserId,
        min_teams: almostMin.minTeams,
        max_teams: almostMin.maxTeams,
        games_per_match: almostMin.gamesPerMatch,
        registration_deadline: daysFromNow(7),
        start_time: daysFromNow(10),
        created_at: daysAgo(5),
      });
      await addParticipants(tournamentId, almostMin.participantCount);
      results.push({
        id: tournamentId,
        name: almostMin.name,
        status: "registration",
        participantCount: almostMin.participantCount,
      });
    }

    // 2. Tournament almost at capacity
    const almostFull = MOCK_TOURNAMENTS.almostFull;
    existingTournament = await ctx.db
      .query("tournaments")
      .filter((q) => q.eq(q.field("name"), almostFull.name))
      .first();

    if (!existingTournament) {
      const tournamentId = await ctx.db.insert("tournaments", {
        name: almostFull.name,
        description: almostFull.description,
        format: almostFull.format,
        status: "registration",
        is_official: almostFull.isOfficial,
        created_by: MOCK_USERS[2].id,
        min_teams: almostFull.minTeams,
        max_teams: almostFull.maxTeams,
        games_per_match: almostFull.gamesPerMatch,
        registration_deadline: daysFromNow(3),
        start_time: daysFromNow(5),
        created_at: daysAgo(10),
      });
      await addParticipants(tournamentId, almostFull.participantCount);
      results.push({
        id: tournamentId,
        name: almostFull.name,
        status: "registration",
        participantCount: almostFull.participantCount,
      });
    }

    // 3. Tournament in progress with matches
    const inProgress = MOCK_TOURNAMENTS.inProgress;
    existingTournament = await ctx.db
      .query("tournaments")
      .filter((q) => q.eq(q.field("name"), inProgress.name))
      .first();

    if (!existingTournament) {
      const tournamentId = await ctx.db.insert("tournaments", {
        name: inProgress.name,
        description: inProgress.description,
        format: inProgress.format,
        status: "in_progress",
        is_official: inProgress.isOfficial,
        created_by: adminUserId,
        min_teams: inProgress.minTeams,
        max_teams: inProgress.maxTeams,
        games_per_match: inProgress.gamesPerMatch,
        start_time: daysAgo(2),
        created_at: daysAgo(14),
      });
      await addParticipants(tournamentId, inProgress.participantCount);

      // Create round robin matches for 4 teams (6 matches total)
      const teamIds = allTeams.slice(0, 4).map((t) => t._id);
      let matchNumber = 0;

      // Round 1: Team 0 vs Team 3, Team 1 vs Team 2
      await ctx.db.insert("tournament_matches", {
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNumber++,
        team1_id: teamIds[0],
        team2_id: teamIds[3],
        status: "completed",
        games: [],
        games_required: inProgress.gamesPerMatch,
        team1_games_won: 1,
        team2_games_won: 0,
        winner_team_id: teamIds[0],
      });

      await ctx.db.insert("tournament_matches", {
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNumber++,
        team1_id: teamIds[1],
        team2_id: teamIds[2],
        status: "completed",
        games: [],
        games_required: inProgress.gamesPerMatch,
        team1_games_won: 0,
        team2_games_won: 1,
        winner_team_id: teamIds[2],
      });

      // Round 2: Team 0 vs Team 2 (in progress), Team 1 vs Team 3
      await ctx.db.insert("tournament_matches", {
        tournament_id: tournamentId,
        round: 2,
        match_number: matchNumber++,
        team1_id: teamIds[0],
        team2_id: teamIds[2],
        status: "in_progress",
        scheduled_time: now,
        games: [],
        games_required: inProgress.gamesPerMatch,
        team1_games_won: 0,
        team2_games_won: 0,
      });

      await ctx.db.insert("tournament_matches", {
        tournament_id: tournamentId,
        round: 2,
        match_number: matchNumber++,
        team1_id: teamIds[1],
        team2_id: teamIds[3],
        status: "scheduled",
        scheduled_time: daysFromNow(1),
        games: [],
        games_required: inProgress.gamesPerMatch,
        team1_games_won: 0,
        team2_games_won: 0,
      });

      // Round 3: Remaining matches (pending)
      await ctx.db.insert("tournament_matches", {
        tournament_id: tournamentId,
        round: 3,
        match_number: matchNumber++,
        team1_id: teamIds[0],
        team2_id: teamIds[1],
        status: "pending",
        games: [],
        games_required: inProgress.gamesPerMatch,
        team1_games_won: 0,
        team2_games_won: 0,
      });

      await ctx.db.insert("tournament_matches", {
        tournament_id: tournamentId,
        round: 3,
        match_number: matchNumber++,
        team1_id: teamIds[2],
        team2_id: teamIds[3],
        status: "pending",
        games: [],
        games_required: inProgress.gamesPerMatch,
        team1_games_won: 0,
        team2_games_won: 0,
      });

      results.push({
        id: tournamentId,
        name: inProgress.name,
        status: "in_progress",
        participantCount: inProgress.participantCount,
      });
    }

    // 4. Completed tournament
    const completed = MOCK_TOURNAMENTS.completed;
    existingTournament = await ctx.db
      .query("tournaments")
      .filter((q) => q.eq(q.field("name"), completed.name))
      .first();

    if (!existingTournament) {
      const tournamentId = await ctx.db.insert("tournaments", {
        name: completed.name,
        description: completed.description,
        format: completed.format,
        status: "completed",
        is_official: completed.isOfficial,
        created_by: adminUserId,
        min_teams: completed.minTeams,
        max_teams: completed.maxTeams,
        games_per_match: completed.gamesPerMatch,
        start_time: daysAgo(30),
        end_time: daysAgo(25),
        created_at: daysAgo(45),
      });
      await addParticipants(tournamentId, completed.participantCount);

      // Create all completed matches
      const teamIds = allTeams.slice(0, 4).map((t) => t._id);
      let matchNumber = 0;

      // All 6 round robin matches completed
      const matchups = [
        { t1: 0, t2: 1, winner: 0 },
        { t1: 0, t2: 2, winner: 0 },
        { t1: 0, t2: 3, winner: 0 },
        { t1: 1, t2: 2, winner: 2 },
        { t1: 1, t2: 3, winner: 1 },
        { t1: 2, t2: 3, winner: 2 },
      ];

      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < 2; i++) {
          const matchup = matchups[round * 2 + i];
          await ctx.db.insert("tournament_matches", {
            tournament_id: tournamentId,
            round: round + 1,
            match_number: matchNumber++,
            team1_id: teamIds[matchup.t1],
            team2_id: teamIds[matchup.t2],
            status: "completed",
            games: [],
            games_required: completed.gamesPerMatch,
            team1_games_won: matchup.winner === matchup.t1 ? 1 : 0,
            team2_games_won: matchup.winner === matchup.t2 ? 1 : 0,
            winner_team_id: teamIds[matchup.winner],
          });
        }
      }

      results.push({
        id: tournamentId,
        name: completed.name,
        status: "completed",
        participantCount: completed.participantCount,
      });
    }

    // 5. Open registration tournament
    const openReg = MOCK_TOURNAMENTS.openRegistration;
    existingTournament = await ctx.db
      .query("tournaments")
      .filter((q) => q.eq(q.field("name"), openReg.name))
      .first();

    if (!existingTournament) {
      const tournamentId = await ctx.db.insert("tournaments", {
        name: openReg.name,
        description: openReg.description,
        format: openReg.format,
        status: "registration",
        is_official: openReg.isOfficial,
        created_by: MOCK_USERS[4].id,
        min_teams: openReg.minTeams,
        max_teams: openReg.maxTeams,
        games_per_match: openReg.gamesPerMatch,
        registration_deadline: daysFromNow(14),
        start_time: daysFromNow(21),
        created_at: daysAgo(2),
      });
      await addParticipants(tournamentId, openReg.participantCount);
      results.push({
        id: tournamentId,
        name: openReg.name,
        status: "registration",
        participantCount: openReg.participantCount,
      });
    }

    return { created: results.length, tournaments: results };
  },
});

/**
 * Seeds everything in the correct order
 * This is the recommended function to run for a fresh database
 */
export const seedAll = internalMutation({
  args: {},
  returns: v.object({
    users: v.object({ created: v.number(), userIds: v.array(v.string()) }),
    teams: v.object({ created: v.number(), teamIds: v.array(v.id("teams")) }),
    tournaments: v.object({
      created: v.number(),
      tournaments: v.array(
        v.object({
          id: v.id("tournaments"),
          name: v.string(),
          status: v.string(),
          participantCount: v.number(),
        })
      ),
    }),
  }),
  handler: async (ctx) => {
    // Seed in dependency order
    const now = Date.now();
    
    // 1. Seed Users
    const userIds: string[] = [];
    for (const user of MOCK_USERS) {
      const existing = await ctx.db
        .query("user_profiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", user.id))
        .first();

      if (!existing) {
        await ctx.db.insert("user_profiles", {
          user_id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          institution: user.institution,
          geographic_location: user.location,
          updated_at: now,
        });
        userIds.push(user.id);
      }
    }
    const usersResult = { created: userIds.length, userIds };

    // 2. Seed Teams
    const teamIds: Id<"teams">[] = [];
    for (const team of MOCK_TEAMS) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_team_name", (q) => q.eq("team_name", team.name))
        .first();

      if (existing) {
        teamIds.push(existing._id);
        continue;
      }

      const leaderId = MOCK_USERS[team.leaderIdx].id;
      const teamId = await ctx.db.insert("teams", {
        team_name: team.name,
        leader_id: leaderId,
        team_elo: team.elo,
        team_wins: team.wins,
        team_losses: team.losses,
      });

      for (const memberIdx of team.memberIdxs) {
        const userId = MOCK_USERS[memberIdx].id;
        const profile = await ctx.db
          .query("user_profiles")
          .withIndex("by_user_id", (q) => q.eq("user_id", userId))
          .first();

        if (profile) {
          await ctx.db.patch(profile._id, {
            team_id: teamId,
            updated_at: now,
          });
        }
      }
      teamIds.push(teamId);
    }
    const teamsResult = { created: teamIds.length, teamIds };

    // 3. Seed Tournaments (inline to avoid circular calls)
    const allTeams = await ctx.db.query("teams").collect();
    const tournamentResults: Array<{
      id: Id<"tournaments">;
      name: string;
      status: string;
      participantCount: number;
    }> = [];
    const adminUserId = MOCK_USERS[0].id;

    // Helper to add participants
    const addParticipants = async (
      tournamentId: Id<"tournaments">,
      count: number
    ) => {
      for (let i = 0; i < count && i < allTeams.length; i++) {
        const existing = await ctx.db
          .query("tournament_participants")
          .withIndex("by_tournament_id_and_team_id", (q) =>
            q.eq("tournament_id", tournamentId).eq("team_id", allTeams[i]._id)
          )
          .first();

        if (!existing) {
          await ctx.db.insert("tournament_participants", {
            tournament_id: tournamentId,
            team_id: allTeams[i]._id,
            seed: i + 1,
            joined_at: daysAgo(Math.floor(seededRandom(i) * 10)),
          });
        }
      }
    };

    // Create tournaments (abbreviated version of seedTournaments logic)
    for (const [key, config] of Object.entries(MOCK_TOURNAMENTS)) {
      const existingTournament = await ctx.db
        .query("tournaments")
        .filter((q) => q.eq(q.field("name"), config.name))
        .first();

      if (existingTournament) continue;

      let status: "registration" | "in_progress" | "completed" | "cancelled" =
        "registration";
      let startTime: number | undefined;
      let endTime: number | undefined;

      if (key === "inProgress") {
        status = "in_progress";
        startTime = daysAgo(2);
      } else if (key === "completed") {
        status = "completed";
        startTime = daysAgo(30);
        endTime = daysAgo(25);
      } else {
        startTime = daysFromNow(key === "almostMinimum" ? 10 : key === "almostFull" ? 5 : 21);
      }

      const tournamentId = await ctx.db.insert("tournaments", {
        name: config.name,
        description: config.description,
        format: config.format,
        status,
        is_official: config.isOfficial,
        created_by: config.isOfficial ? adminUserId : MOCK_USERS[2].id,
        min_teams: config.minTeams,
        max_teams: config.maxTeams,
        games_per_match: config.gamesPerMatch,
        registration_deadline: status === "registration" ? daysFromNow(7) : undefined,
        start_time: startTime,
        end_time: endTime,
        created_at: daysAgo(key === "openRegistration" ? 2 : 14),
      });

      await addParticipants(tournamentId, config.participantCount);

      // Add matches for in_progress and completed tournaments
      if (status === "in_progress" || status === "completed") {
        const teamIdsForMatches = allTeams.slice(0, 4).map((t) => t._id);
        let matchNumber = 0;

        if (status === "in_progress") {
          // Mix of completed, in_progress, and pending matches
          await ctx.db.insert("tournament_matches", {
            tournament_id: tournamentId,
            round: 1,
            match_number: matchNumber++,
            team1_id: teamIdsForMatches[0],
            team2_id: teamIdsForMatches[3],
            status: "completed",
            games: [],
            games_required: config.gamesPerMatch,
            team1_games_won: 1,
            team2_games_won: 0,
            winner_team_id: teamIdsForMatches[0],
          });

          await ctx.db.insert("tournament_matches", {
            tournament_id: tournamentId,
            round: 1,
            match_number: matchNumber++,
            team1_id: teamIdsForMatches[1],
            team2_id: teamIdsForMatches[2],
            status: "completed",
            games: [],
            games_required: config.gamesPerMatch,
            team1_games_won: 0,
            team2_games_won: 1,
            winner_team_id: teamIdsForMatches[2],
          });

          await ctx.db.insert("tournament_matches", {
            tournament_id: tournamentId,
            round: 2,
            match_number: matchNumber++,
            team1_id: teamIdsForMatches[0],
            team2_id: teamIdsForMatches[2],
            status: "in_progress",
            scheduled_time: now,
            games: [],
            games_required: config.gamesPerMatch,
            team1_games_won: 0,
            team2_games_won: 0,
          });

          await ctx.db.insert("tournament_matches", {
            tournament_id: tournamentId,
            round: 2,
            match_number: matchNumber++,
            team1_id: teamIdsForMatches[1],
            team2_id: teamIdsForMatches[3],
            status: "scheduled",
            scheduled_time: daysFromNow(1),
            games: [],
            games_required: config.gamesPerMatch,
            team1_games_won: 0,
            team2_games_won: 0,
          });

          await ctx.db.insert("tournament_matches", {
            tournament_id: tournamentId,
            round: 3,
            match_number: matchNumber++,
            team1_id: teamIdsForMatches[0],
            team2_id: teamIdsForMatches[1],
            status: "pending",
            games: [],
            games_required: config.gamesPerMatch,
            team1_games_won: 0,
            team2_games_won: 0,
          });

          await ctx.db.insert("tournament_matches", {
            tournament_id: tournamentId,
            round: 3,
            match_number: matchNumber++,
            team1_id: teamIdsForMatches[2],
            team2_id: teamIdsForMatches[3],
            status: "pending",
            games: [],
            games_required: config.gamesPerMatch,
            team1_games_won: 0,
            team2_games_won: 0,
          });
        } else {
          // All completed matches
          const matchups = [
            { t1: 0, t2: 1, winner: 0 },
            { t1: 0, t2: 2, winner: 0 },
            { t1: 0, t2: 3, winner: 0 },
            { t1: 1, t2: 2, winner: 2 },
            { t1: 1, t2: 3, winner: 1 },
            { t1: 2, t2: 3, winner: 2 },
          ];

          for (let round = 0; round < 3; round++) {
            for (let i = 0; i < 2; i++) {
              const matchup = matchups[round * 2 + i];
              await ctx.db.insert("tournament_matches", {
                tournament_id: tournamentId,
                round: round + 1,
                match_number: matchNumber++,
                team1_id: teamIdsForMatches[matchup.t1],
                team2_id: teamIdsForMatches[matchup.t2],
                status: "completed",
                games: [],
                games_required: config.gamesPerMatch,
                team1_games_won: matchup.winner === matchup.t1 ? 1 : 0,
                team2_games_won: matchup.winner === matchup.t2 ? 1 : 0,
                winner_team_id: teamIdsForMatches[matchup.winner],
              });
            }
          }
        }
      }

      tournamentResults.push({
        id: tournamentId,
        name: config.name,
        status,
        participantCount: config.participantCount,
      });
    }

    return {
      users: usersResult,
      teams: teamsResult,
      tournaments: { created: tournamentResults.length, tournaments: tournamentResults },
    };
  },
});

// ============================================================================
// CLEAR MUTATIONS (Use with caution!)
// ============================================================================

/**
 * Clears all seeded tournament data
 * Does NOT clear users or teams (they might be used by real data)
 */
export const clearTournaments = internalMutation({
  args: {},
  returns: v.object({
    deletedTournaments: v.number(),
    deletedParticipants: v.number(),
    deletedMatches: v.number(),
  }),
  handler: async (ctx) => {
    // Delete all tournament matches
    const matches = await ctx.db.query("tournament_matches").collect();
    for (const match of matches) {
      await ctx.db.delete(match._id);
    }

    // Delete all tournament participants
    const participants = await ctx.db.query("tournament_participants").collect();
    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Delete all tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const tournament of tournaments) {
      await ctx.db.delete(tournament._id);
    }

    return {
      deletedTournaments: tournaments.length,
      deletedParticipants: participants.length,
      deletedMatches: matches.length,
    };
  },
});

/**
 * Clears ALL seeded data including users and teams
 * WARNING: This will delete everything! Use only for complete reset.
 */
export const clearAll = internalMutation({
  args: {
    confirmDeletion: v.literal("DELETE_ALL_SEED_DATA"),
  },
  returns: v.object({
    deletedUsers: v.number(),
    deletedTeams: v.number(),
    deletedTournaments: v.number(),
    deletedParticipants: v.number(),
    deletedMatches: v.number(),
  }),
  handler: async (ctx, args) => {
    // This confirmation is to prevent accidental deletion
    if (args.confirmDeletion !== "DELETE_ALL_SEED_DATA") {
      throw new Error("Must confirm deletion with exact string");
    }

    // Delete tournament matches
    const matches = await ctx.db.query("tournament_matches").collect();
    for (const match of matches) {
      await ctx.db.delete(match._id);
    }

    // Delete tournament participants
    const participants = await ctx.db.query("tournament_participants").collect();
    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Delete tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const tournament of tournaments) {
      await ctx.db.delete(tournament._id);
    }

    // Delete teams (clear team_id from profiles first)
    const seededUserIds = MOCK_USERS.map((u) => u.id);
    const profiles = await ctx.db.query("user_profiles").collect();
    for (const profile of profiles) {
      if (profile.team_id) {
        await ctx.db.patch(profile._id, { team_id: undefined, updated_at: Date.now() });
      }
    }

    const teams = await ctx.db.query("teams").collect();
    for (const team of teams) {
      await ctx.db.delete(team._id);
    }

    // Delete seeded user profiles only
    let deletedUsers = 0;
    for (const profile of profiles) {
      if ((seededUserIds as readonly string[]).includes(profile.user_id)) {
        await ctx.db.delete(profile._id);
        deletedUsers++;
      }
    }

    return {
      deletedUsers,
      deletedTeams: teams.length,
      deletedTournaments: tournaments.length,
      deletedParticipants: participants.length,
      deletedMatches: matches.length,
    };
  },
});

// ============================================================================
// UTILITY MUTATIONS FOR TESTING SPECIFIC SCENARIOS
// ============================================================================

/**
 * Add a specific team to a tournament
 * Useful for testing the "1 more team needed" scenarios
 */
export const addTeamToTournament = internalMutation({
  args: {
    tournamentId: v.id("tournaments"),
    teamId: v.id("teams"),
  },
  returns: v.object({
    success: v.boolean(),
    participantId: v.optional(v.id("tournament_participants")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.status !== "registration") {
      return { success: false, error: "Tournament not in registration phase" };
    }

    const existing = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id_and_team_id", (q) =>
        q.eq("tournament_id", args.tournamentId).eq("team_id", args.teamId)
      )
      .first();

    if (existing) {
      return { success: false, error: "Team already registered" };
    }

    const currentParticipants = await ctx.db
      .query("tournament_participants")
      .withIndex("by_tournament_id", (q) =>
        q.eq("tournament_id", args.tournamentId)
      )
      .collect();

    if (currentParticipants.length >= tournament.max_teams) {
      return { success: false, error: "Tournament is full" };
    }

    const participantId = await ctx.db.insert("tournament_participants", {
      tournament_id: args.tournamentId,
      team_id: args.teamId,
      seed: currentParticipants.length + 1,
      joined_at: Date.now(),
    });

    return { success: true, participantId };
  },
});

/**
 * Update a tournament's status manually
 * Useful for testing different UI states
 */
export const updateTournamentStatus = internalMutation({
  args: {
    tournamentId: v.id("tournaments"),
    status: v.union(
      v.literal("registration"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) {
      return { success: false };
    }

    await ctx.db.patch(args.tournamentId, { status: args.status });
    return { success: true };
  },
});

/**
 * Update a tournament match status manually
 * Useful for testing match state transitions
 */
export const updateMatchStatus = internalMutation({
  args: {
    matchId: v.id("tournament_matches"),
    status: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    winnerId: v.optional(v.id("teams")),
    team1GamesWon: v.optional(v.number()),
    team2GamesWon: v.optional(v.number()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return { success: false };
    }

    const updates: Partial<{
      status: typeof args.status;
      winner_team_id: Id<"teams">;
      team1_games_won: number;
      team2_games_won: number;
    }> = { status: args.status };

    if (args.winnerId) updates.winner_team_id = args.winnerId;
    if (args.team1GamesWon !== undefined) updates.team1_games_won = args.team1GamesWon;
    if (args.team2GamesWon !== undefined) updates.team2_games_won = args.team2GamesWon;

    await ctx.db.patch(args.matchId, updates);
    return { success: true };
  },
});
