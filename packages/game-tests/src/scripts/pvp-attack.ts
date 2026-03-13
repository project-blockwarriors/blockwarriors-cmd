import type { BotClient } from "@packages/bot-client";
import type { BotScript, MatchContext } from "../MatchOrchestrator.js";

/**
 * PvP bot script: continuously follows and attacks the nearest player.
 * Runs until the bot dies or the timeout is reached.
 */
export const pvpAttackScript: BotScript = {
  name: "pvp-attack",

  async execute(
    botClient: BotClient,
    botId: string,
    context: MatchContext
  ): Promise<void> {
    // Wait a moment for teleportation to game world
    await sleep(3000);

    const attackLoop = async () => {
      const maxDuration = 90_000;
      const start = Date.now();

      while (Date.now() - start < maxDuration) {
        const state = botClient.getBotState(botId);
        if (!state || state.status === "offline" || state.status === "error") {
          return;
        }

        // Look for opponent players
        const opponent = state.nearbyEntities.find(
          (e) => e.isPlayer && context.opponentIgns.includes(e.displayName)
        );

        if (opponent) {
          // Attack the opponent entity
          await botClient.executeCommand(botId, {
            type: "attack_entity",
            payload: { entityId: opponent.id },
          });
        } else {
          // No opponent visible — just attack nearest entity as fallback
          await botClient.executeCommand(botId, { type: "attack" });
        }

        await sleep(2000);
      }
    };

    // Race between attack loop and death
    await Promise.race([
      attackLoop(),
      botClient.waitForDeath(botId, 120_000).catch(() => {}),
    ]);
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
