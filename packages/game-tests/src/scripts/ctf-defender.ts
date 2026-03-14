import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * CTF defender bot: patrols near own flag. Exits early if kicked.
 */
export const ctfDefenderScript: BotScript = {
  name: "ctf-defender",

  async execute(
    botClient: BotClient,
    botId: string,
    context: MatchContext
  ): Promise<void> {
    await sleep(5000);

    const isBlue = context.team === "blue";
    const flagX = isBlue ? 21 : -21;
    const flagY = 66;
    const patrolPoints = [
      { x: flagX, y: flagY, z: -3 },
      { x: flagX + (isBlue ? -3 : 3), y: flagY, z: 0 },
      { x: flagX, y: flagY, z: 3 },
    ];
    let idx = 0;

    const maxDuration = 40_000; // 40s — forfeit ends match before this
    const start = Date.now();

    while (Date.now() - start < maxDuration) {
      const state = botClient.getBotState(botId);
      if (!state || state.status === "offline" || state.status === "error") return;

      const point = patrolPoints[idx % patrolPoints.length];
      await botClient.executeCommand(botId, { type: "goto", payload: point });
      idx++;
      await sleep(3000);
    }
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
