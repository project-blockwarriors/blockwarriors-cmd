import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * Bridge bot script: sprints and attacks. Exits early if kicked.
 */
export const bridgeRushScript: BotScript = {
  name: "bridge-rush",

  async execute(
    botClient: BotClient,
    botId: string,
    context: MatchContext
  ): Promise<void> {
    await sleep(3000);

    const maxDuration = 30_000; // 30s — forfeit ends match before this
    const start = Date.now();

    while (Date.now() - start < maxDuration) {
      const state = botClient.getBotState(botId);
      if (!state || state.status === "offline" || state.status === "error") return;

      await botClient.executeCommand(botId, { type: "sprint", payload: { enabled: true } });
      await sleep(1000);
    }
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
