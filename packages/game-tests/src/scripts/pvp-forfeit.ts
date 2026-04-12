import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * PvP bot that disconnects after the game is fully active (past countdown).
 * Waits 15s to ensure the 5s countdown completes and the game is IN_PROGRESS.
 */
export const pvpForfeitScript: BotScript = {
  name: "pvp-forfeit",

  async execute(
    botClient: BotClient,
    botId: string,
    _context: MatchContext
  ): Promise<void> {
    // Wait 15s: 3s teleport + 5s countdown + 7s buffer for IN_PROGRESS
    await sleep(15000);

    const state = botClient.getBotState(botId);
    if (!state || state.status === "offline" || state.status === "error") {
      return;
    }

    // Disconnect to trigger instant forfeit
    botClient.removeBot(botId);
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
