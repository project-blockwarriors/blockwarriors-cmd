import {
  MatchOrchestrator,
  type MatchOrchestratorConfig,
  type ScenarioResult,
} from "../MatchOrchestrator.js";
import { pvpAttackScript } from "../scripts/pvp-attack.js";

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
      red: [pvpAttackScript],
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
      if (
        result.winnerTeamId !== result.blueTeamId &&
        result.winnerTeamId !== result.redTeamId
      ) {
        throw new Error(
          `Winner ${result.winnerTeamId} is not blue (${result.blueTeamId}) or red (${result.redTeamId})`
        );
      }
    }
  );
}
