import {
  MatchOrchestrator,
  type MatchOrchestratorConfig,
  type ScenarioResult,
} from "../MatchOrchestrator.js";
import { bridgeRushScript } from "../scripts/bridge-rush.js";
import { bridgeForfeitScript } from "../scripts/bridge-forfeit.js";

/**
 * Bridge 1v1 test scenario.
 *
 * Blue bot plays normally (rush/attack), red bot disconnects after ~15s
 * to trigger instant forfeit. This tests:
 * - Match creation for bridge game type
 * - Bot spawning on separate platforms
 * - Bridge game countdown and start
 * - Disconnect handling (instant forfeit policy)
 * - Match finishes with blue as winner
 */
export async function runBridge1v1(
  config: MatchOrchestratorConfig
): Promise<ScenarioResult> {
  const orchestrator = new MatchOrchestrator(config);

  return orchestrator.runScenario(
    "Bridge 1v1",
    "bridge",
    "practice",
    {
      blue: [bridgeRushScript],
      red: [bridgeForfeitScript],
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
      // Bridge game can take up to 5 min + sudden death, but with forfeit
      // it should end in ~20s. Give generous timeout just in case.
      finishTimeoutMs: 60000,
    }
  );
}
