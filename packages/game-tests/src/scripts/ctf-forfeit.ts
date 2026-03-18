import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * CTF bot that disconnects after the game is fully active (past countdown).
 * CTF has a 10s countdown. Waits 20s to ensure IN_PROGRESS state.
 */
export const ctfForfeitScript: BotScript = {
  name: "ctf-forfeit",

  async execute(
    botClient: BotClient,
    botId: string,
    _context: MatchContext
  ): Promise<void> {
    // Wait 20s: teleport stagger + 10s countdown + buffer
    await sleep(20000);

    const state = botClient.getBotState(botId);
    if (!state || state.status === "offline" || state.status === "error") {
      return;
    }

    // Disconnect to contribute to team forfeit
    botClient.removeBot(botId);
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
