import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * CTF attacker bot: rushes enemy flag. Exits early if kicked.
 */
export const ctfAttackerScript: BotScript = {
  name: "ctf-attacker",

  async execute(
    botClient: BotClient,
    botId: string,
    context: MatchContext
  ): Promise<void> {
    await sleep(5000);

    const isBlue = context.team === "blue";
    const enemyFlagX = isBlue ? -21 : 21;
    const ownFlagX = isBlue ? 21 : -21;
    const flagY = 66;

    const maxDuration = 40_000; // 40s — forfeit ends match before this
    const start = Date.now();
    let phase: "rush" | "capture" = "rush";

    while (Date.now() - start < maxDuration) {
      const state = botClient.getBotState(botId);
      if (!state || state.status === "offline" || state.status === "error") return;

      if (phase === "rush" && state.position) {
        const dist = Math.sqrt((state.position.x - enemyFlagX) ** 2 + state.position.z ** 2);
        if (dist < 3) phase = "capture";
      }
      if (phase === "capture" && state.position) {
        const dist = Math.sqrt((state.position.x - ownFlagX) ** 2 + state.position.z ** 2);
        if (dist < 4) phase = "rush";
      }

      const targetX = phase === "rush" ? enemyFlagX : ownFlagX;
      await botClient.executeCommand(botId, {
        type: "goto",
        payload: { x: targetX, y: flagY, z: 0 },
      });

      await sleep(2000);
    }
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
