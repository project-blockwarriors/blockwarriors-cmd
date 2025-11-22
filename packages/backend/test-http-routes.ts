/**
 * Test client for Convex HTTP routes
 *
 * Usage:
 * 1. Set CONVEX_URL and CONVEX_SITE_URL in .env.local file
 * 2. Run: npm run test:http
 *
 * The script will automatically load environment variables from .env.local
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";
import { Id } from "./convex/_generated/dataModel";

// Load environment variables from .env.local (in current directory)
config({ path: ".env.local" });

const CONVEX_URL = process.env.CONVEX_URL || "";
// Derive CONVEX_SITE_URL from CONVEX_URL if not set
// Convex site URL is typically the deployment URL with .convex.site instead of .convex.cloud
const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ||
  (CONVEX_URL ? CONVEX_URL.replace(".convex.cloud", ".convex.site") : "");

if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL environment variable is not set");
  process.exit(1);
}

if (!CONVEX_SITE_URL) {
  console.error("Error: CONVEX_SITE_URL environment variable is not set");
  console.error(
    "Set it to your Convex site URL, e.g., https://your-deployment.convex.site"
  );
  process.exit(1);
}

const convexClient = new ConvexHttpClient(CONVEX_URL);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const data = await fn();
    results.push({ name, passed: true, data });
    console.log(`✅ PASSED: ${name}`);
    if (data) {
      console.log(`   Result:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${errorMessage}`);
  }
}

async function main() {
  console.log("🚀 Starting HTTP Routes Test Suite");
  console.log(`📡 Convex URL: ${CONVEX_URL}`);
  console.log(`🌐 Convex Site URL: ${CONVEX_SITE_URL}`);

  // Step 1: Create test game teams
  let blueTeamId: Id<"game_teams"> | undefined;
  let redTeamId: Id<"game_teams"> | undefined;

  await test("Create game teams for testing", async () => {
    const teams = await convexClient.mutation(
      api.gameTeams.createGameTeamsForMatch,
      {
        redTeamBots: [],
        blueTeamBots: [],
      }
    );
    blueTeamId = teams.blueTeamId;
    redTeamId = teams.redTeamId;
    return teams;
  });

  if (!blueTeamId || !redTeamId) {
    console.error("Failed to create game teams. Cannot continue tests.");
    process.exit(1);
  }

  // Step 2: Test POST /matches/new
  let createdMatchId: Id<"matches"> | undefined;

  await test("POST /matches/new - Create match with Queuing status", async () => {
    const response = await fetch(`${CONVEX_SITE_URL}/matches/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        match_type: "pvp",
        mode: "pvp",
        blue_team_id: blueTeamId,
        red_team_id: redTeamId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
    }

    const match = await response.json();
    createdMatchId = match.match_id;
    return match;
  });

  await test("POST /matches/new - Create match with match_state", async () => {
    const matchState = {
      score: { blue: 0, red: 0 },
      phase: "setup",
      players: [],
    };

    const response = await fetch(`${CONVEX_SITE_URL}/matches/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        match_type: "bedwars",
        mode: "bedwars",
        blue_team_id: blueTeamId,
        red_team_id: redTeamId,
        match_state: matchState,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
    }

    const match = await response.json();
    // Compare match_state using deep equality (JSON.stringify with sorted keys)
    // Object key order can differ, so we need to compare the parsed values
    const savedState = match.match_state ?? null;
    const expectedState = matchState ?? null;
    const savedStr = JSON.stringify(
      savedState,
      Object.keys(savedState || {}).sort()
    );
    const expectedStr = JSON.stringify(
      expectedState,
      Object.keys(expectedState || {}).sort()
    );
    if (savedStr !== expectedStr) {
      throw new Error("match_state was not saved correctly");
    }
    return match;
  });

  await test("POST /matches/new - Missing required fields", async () => {
    const response = await fetch(`${CONVEX_SITE_URL}/matches/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        match_type: "pvp",
        // Missing mode, blue_team_id, red_team_id
      }),
    });

    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }

    const error = await response.json();
    return error;
  });

  // Step 3: Test GET /matches?id={_id} (Convex doesn't support path parameters)
  if (createdMatchId) {
    await test("GET /matches?id={_id} - Get match by ID", async () => {
      const response = await fetch(
        `${CONVEX_SITE_URL}/matches?id=${createdMatchId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
      }

      const match = await response.json();
      if (match.match_id !== createdMatchId) {
        throw new Error("Match ID mismatch");
      }
      if (match.match_status !== "Queuing") {
        throw new Error(
          `Expected status 'Queuing', got '${match.match_status}'`
        );
      }
      return match;
    });

    await test("GET /matches?id={_id} - Non-existent match", async () => {
      const fakeId = "j0000000000000000000000000" as Id<"matches">;
      const response = await fetch(`${CONVEX_SITE_URL}/matches?id=${fakeId}`);

      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }

      const error = await response.json();
      return error;
    });
  }

  // Step 4: Test POST /matches/update - Update status
  // Note: Convex doesn't support path parameters, so we use /matches/update with match_id in body
  if (createdMatchId) {
    await test("POST /matches/update - Update match_status to Waiting", async () => {
      const response = await fetch(`${CONVEX_SITE_URL}/matches/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: createdMatchId,
          match_status: "Waiting",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
      }

      const match = await response.json();
      if (match.match_status !== "Waiting") {
        throw new Error(
          `Expected status 'Waiting', got '${match.match_status}'`
        );
      }
      return match;
    });

    await test("POST /matches/update - Update match_status to Playing", async () => {
      const response = await fetch(`${CONVEX_SITE_URL}/matches/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: createdMatchId,
          match_status: "Playing",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
      }

      const match = await response.json();
      if (match.match_status !== "Playing") {
        throw new Error(
          `Expected status 'Playing', got '${match.match_status}'`
        );
      }
      return match;
    });

    await test("POST /matches/update - Update match_state", async () => {
      const newState = {
        score: { blue: 5, red: 3 },
        phase: "active",
        players: ["player1", "player2"],
        timestamp: Date.now(),
      };

      const response = await fetch(`${CONVEX_SITE_URL}/matches/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: createdMatchId,
          match_state: newState,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
      }

      const match = await response.json();
      // Compare match_state using deep equality (JSON.stringify with sorted keys)
      const savedState = match.match_state ?? null;
      const expectedState = newState ?? null;
      const savedStr = JSON.stringify(
        savedState,
        Object.keys(savedState || {}).sort()
      );
      const expectedStr = JSON.stringify(
        expectedState,
        Object.keys(expectedState || {}).sort()
      );
      if (savedStr !== expectedStr) {
        throw new Error("match_state was not updated correctly");
      }
      return match;
    });

    await test("POST /matches/update - Update both status and state", async () => {
      const newState = {
        score: { blue: 10, red: 7 },
        phase: "final",
        winner: "blue",
      };

      const response = await fetch(`${CONVEX_SITE_URL}/matches/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: createdMatchId,
          match_status: "Finished",
          match_state: newState,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
      }

      const match = await response.json();
      if (match.match_status !== "Finished") {
        throw new Error(
          `Expected status 'Finished', got '${match.match_status}'`
        );
      }
      // Compare match_state using deep equality (JSON.stringify with sorted keys)
      const savedState = match.match_state ?? null;
      const expectedState = newState ?? null;
      const savedStr = JSON.stringify(
        savedState,
        Object.keys(savedState || {}).sort()
      );
      const expectedStr = JSON.stringify(
        expectedState,
        Object.keys(expectedState || {}).sort()
      );
      if (savedStr !== expectedStr) {
        throw new Error("match_state was not updated correctly");
      }
      return match;
    });

    await test("POST /matches/update - Invalid status transition", async () => {
      // Try to go from Finished back to Playing (should fail)
      const response = await fetch(`${CONVEX_SITE_URL}/matches/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: createdMatchId,
          match_status: "Playing",
        }),
      });

      if (response.status !== 400) {
        throw new Error(
          `Expected 400 for invalid transition, got ${response.status}`
        );
      }

      const error = await response.json();
      if (!error.error.includes("Invalid status transition")) {
        throw new Error("Error message doesn't mention invalid transition");
      }
      return error;
    });

    await test("POST /matches/update - Missing both fields", async () => {
      const response = await fetch(`${CONVEX_SITE_URL}/matches/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: createdMatchId,
        }),
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }

      const error = await response.json();
      return error;
    });
  }

  // Step 5: Test GET /matches - List matches
  await test("GET /matches - List all matches", async () => {
    const response = await fetch(`${CONVEX_SITE_URL}/matches`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
    }

    const matches = await response.json();
    if (!Array.isArray(matches)) {
      throw new Error("Expected array of matches");
    }
    return { count: matches.length, matches: matches.slice(0, 3) };
  });

  await test("GET /matches?status=Queuing - Filter by status", async () => {
    const response = await fetch(`${CONVEX_SITE_URL}/matches?status=Queuing`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
    }

    const matches = await response.json();
    if (!Array.isArray(matches)) {
      throw new Error("Expected array of matches");
    }
    for (const match of matches) {
      if (match.match_status !== "Queuing") {
        throw new Error(
          `Found match with status '${match.match_status}', expected 'Queuing'`
        );
      }
    }
    return { count: matches.length, allQueuing: true };
  });

  await test("GET /matches?status=Playing - Filter by status", async () => {
    const response = await fetch(`${CONVEX_SITE_URL}/matches?status=Playing`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
    }

    const matches = await response.json();
    if (!Array.isArray(matches)) {
      throw new Error("Expected array of matches");
    }
    for (const match of matches) {
      if (match.match_status !== "Playing") {
        throw new Error(
          `Found match with status '${match.match_status}', expected 'Playing'`
        );
      }
    }
    return { count: matches.length, allPlaying: true };
  });

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${results.length}`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
