import {
  MatchOrchestrator,
  type MatchOrchestratorConfig,
  type ScenarioResult,
} from "../MatchOrchestrator.js";
import { pvpAttackScript } from "../scripts/pvp-attack.js";
import { pvpForfeitScript } from "../scripts/pvp-forfeit.js";

/**
 * PvP 1v1 test scenario.
 *
 * Blue bot attacks normally, red bot disconnects after ~10s to trigger
 * instant forfeit. This reliably tests the full match lifecycle without
 * depending on bots actually killing each other.
 *
 * Tests:
 * - Match creation for PvP game type
 * - Bot spawning and login
 * - PvP game countdown and start
 * - Disconnect handling (instant forfeit policy)
 * - Match finishes with blue as winner
 */
export async function runPvp1v1(
  config: MatchOrchestratorConfig
): Promise<ScenarioResult> {
  const orchestrator = new MatchOrchestrator(config);

  return orchestrator.runScenario(
    "PvP 1v1",
    "pvp",
    "practice",
    {
      blue: [pvpAttackScript],
      red: [pvpForfeitScript],
    },
    (result) => {
      if (result.finalStatus !== "Finished") {
        throw new Error(
          `Expected match status "Finished", got "${result.finalStatus}"`
        );
      }
      if (!result.winnerTeamId) {
        throw new Error("Match finished without a winner");
      }
      // Blue should win since red disconnects (instant forfeit)
      if (result.winnerTeamId !== result.blueTeamId) {
        throw new Error(
          `Expected blue team (${result.blueTeamId}) to win, but winner was ${result.winnerTeamId}`
        );
      }
    },
    {
      finishTimeoutMs: 60000,
    }
  );
}
