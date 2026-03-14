import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * PvP bot script: follows and attacks the opponent.
 * Exits early if the bot goes offline (match ended, kicked, etc).
 */
export const pvpAttackScript: BotScript = {
  name: "pvp-attack",

  async execute(
    botClient: BotClient,
    botId: string,
    context: MatchContext
  ): Promise<void> {
    await sleep(3000);

    const maxDuration = 30_000; // 30s max — forfeit ends the match before this
    const start = Date.now();

    while (Date.now() - start < maxDuration) {
      const state = botClient.getBotState(botId);
      if (!state || state.status === "offline" || state.status === "error") return;

      const opponent = state.nearbyEntities.find(
        (e) => e.isPlayer && context.opponentIgns.includes(e.displayName)
      );

      if (opponent) {
        await botClient.executeCommand(botId, {
          type: "attack_entity",
          payload: { entityId: opponent.id },
        });
      } else {
        await botClient.executeCommand(botId, { type: "attack" });
      }

      await sleep(500);
    }
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
