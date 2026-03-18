import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MatchOrchestratorConfig, ScenarioResult } from "./MatchOrchestrator.js";
import { runPvp1v1 } from "./scenarios/pvp-1v1.js";
import { runBridge1v1 } from "./scenarios/bridge-1v1.js";
import { runCtf4v4 } from "./scenarios/ctf-4v4.js";
import { runTournamentFlow } from "./scenarios/tournament-flow.js";

// Prevent unhandled errors from crashing the process (e.g., bot keepalive timeouts)
process.on("uncaughtException", (err) => {
  if (err.message?.includes("timed out") || err.message?.includes("EPIPE") || err.message?.includes("ECONNRESET")) {
    // Expected during bot disconnection — suppress
    return;
  }
  console.error("Uncaught exception:", err);
  process.exitCode = 1;
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");

// Load env from repo root
config({ path: path.join(repoRoot, ".env.local") });
config({ path: path.join(repoRoot, ".env") });

const CONVEX_URL = process.env.CONVEX_URL || "";
const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ||
  (CONVEX_URL ? CONVEX_URL.replace(".convex.cloud", ".convex.site") : "");
const CONVEX_HTTP_SECRET = process.env.CONVEX_HTTP_SECRET || "";
const MINECRAFT_HOST =
  process.env.MINECRAFT_HOST || "mcpanel.blockwarriors.ai";
const MINECRAFT_PORT = parseInt(
  process.env.MINECRAFT_PORT || "25565",
  10
);

if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL is not set in .env.local");
  process.exit(1);
}
if (!CONVEX_HTTP_SECRET) {
  console.error("Error: CONVEX_HTTP_SECRET is not set in .env.local");
  process.exit(1);
}

const orchestratorConfig: MatchOrchestratorConfig = {
  convexUrl: CONVEX_URL,
  convexSiteUrl: CONVEX_SITE_URL,
  convexHttpSecret: CONVEX_HTTP_SECRET,
  minecraftHost: MINECRAFT_HOST,
  minecraftPort: MINECRAFT_PORT,
};

type ScenarioFn = (config: MatchOrchestratorConfig) => Promise<ScenarioResult>;

const SCENARIOS: Record<string, ScenarioFn> = {
  "pvp-1v1": runPvp1v1,
  "bridge-1v1": runBridge1v1,
  "ctf-4v4": runCtf4v4,
  "tournament-flow": runTournamentFlow,
};

async function main() {
  const args = process.argv.slice(2);
  const scenarioFilter = args.find((a) => !a.startsWith("-"));

  const scenariosToRun = scenarioFilter
    ? Object.entries(SCENARIOS).filter(([name]) => name.includes(scenarioFilter))
    : Object.entries(SCENARIOS);

  if (scenariosToRun.length === 0) {
    console.error(
      `No scenarios match "${scenarioFilter}". Available: ${Object.keys(SCENARIOS).join(", ")}`
    );
    process.exit(1);
  }

  console.log("BlockWarriors Game Test Runner");
  console.log(`  Convex: ${CONVEX_URL}`);
  console.log(`  Server: ${MINECRAFT_HOST}:${MINECRAFT_PORT}`);
  console.log(`  Scenarios: ${scenariosToRun.map(([n]) => n).join(", ")}`);
  console.log("");

  const results: ScenarioResult[] = [];

  for (const [name, runFn] of scenariosToRun) {
    console.log(`--- ${name} ---`);
    const result = await runFn(orchestratorConfig);
    results.push(result);

    for (const stage of result.stages) {
      const icon = stage.passed ? "+" : "x";
      const time = `${(stage.durationMs / 1000).toFixed(1)}s`;
      console.log(`  [${icon}] ${stage.name} (${time})`);
      if (stage.error) {
        console.log(`      ${stage.error}`);
      }
    }

    const totalTime = `${(result.durationMs / 1000).toFixed(1)}s`;
    if (result.passed) {
      console.log(`  PASSED (${totalTime})`);
    } else {
      console.log(`  FAILED (${totalTime}): ${result.error}`);
    }
    console.log("");
  }

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log("=== Summary ===");
  console.log(`${passed} passed, ${failed} failed, ${results.length} total`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Game test runner failed:", err);
  process.exitCode = 1;
});
