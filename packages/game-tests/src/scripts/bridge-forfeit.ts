import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * Bridge bot that disconnects after a delay, triggering a forfeit.
 * Used in tests to end the match quickly since bots can't bridge
 * across the void gap without block-placing support.
 */
export const bridgeForfeitScript: BotScript = {
  name: "bridge-forfeit",

  async execute(
    botClient: BotClient,
    botId: string,
    _context: MatchContext
  ): Promise<void> {
    // Wait for teleport and game start
    await sleep(5000);

    // Attack for a bit to verify the game is running
    for (let i = 0; i < 5; i++) {
      const state = botClient.getBotState(botId);
      if (!state || state.status === "offline" || state.status === "error") {
        return;
      }
      await botClient.executeCommand(botId, { type: "attack" });
      await sleep(2000);
    }

    // Disconnect to trigger forfeit (BridgeGame uses instantForfeit policy)
    botClient.removeBot(botId);
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
