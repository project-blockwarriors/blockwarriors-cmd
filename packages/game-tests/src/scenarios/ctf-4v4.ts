import {
  MatchOrchestrator,
  type MatchOrchestratorConfig,
  type ScenarioResult,
} from "../MatchOrchestrator.js";
import { ctfAttackerScript } from "../scripts/ctf-attacker.js";
import { ctfDefenderScript } from "../scripts/ctf-defender.js";
import { ctfForfeitScript } from "../scripts/ctf-forfeit.js";

/**
 * CTF 4v4 test scenario.
 *
 * Blue team has 3 attackers + 1 defender (play normally).
 * Red team has 4 forfeit bots that all disconnect after ~12s.
 *
 * When all 4 red bots disconnect, red team has <2 active players,
 * triggering team forfeit. Blue team wins.
 *
 * This tests:
 * - 4v4 match creation (8 bots total)
 * - CTF game countdown and start with staggered teleports
 * - Bot spawning with 8 concurrent connections
 * - Disconnect handling (teamGame policy, forfeit on <2 players)
 * - Match finishes with blue as winner
 */
export async function runCtf4v4(
  config: MatchOrchestratorConfig
): Promise<ScenarioResult> {
  const orchestrator = new MatchOrchestrator(config);

  return orchestrator.runScenario(
    "CTF 4v4",
    "ctf",
    "practice",
    {
      blue: [
        ctfAttackerScript,
        ctfAttackerScript,
        ctfAttackerScript,
        ctfDefenderScript,
      ],
      red: [
        ctfForfeitScript,
        ctfForfeitScript,
        ctfForfeitScript,
        ctfForfeitScript,
      ],
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
      // Blue should win since all red bots disconnect (team forfeit)
      if (result.winnerTeamId !== result.blueTeamId) {
        throw new Error(
          `Expected blue team (${result.blueTeamId}) to win, but winner was ${result.winnerTeamId}`
        );
      }
    },
    {
      // Red bots disconnect after ~12s, server detects after ~30s grace.
      // Give generous timeout.
      finishTimeoutMs: 120000,
    }
  );
}
