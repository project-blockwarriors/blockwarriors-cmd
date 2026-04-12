import type { Strategy, BotAPI, GameState } from "@blockwarriors/sdk";

/**
 * YOUR BOT STRATEGY
 *
 * Edit this file to control your bot's behavior.
 * The onTick function runs every 500ms during the match.
 */
export const myStrategy: Strategy = {
  onSpawn(bot: BotAPI) {
    console.log("Bot spawned! Waiting for match to start...");
  },

  onTick(bot: BotAPI, state: GameState) {
    // Find the nearest enemy player
    const enemy = bot.nearbyEnemies[0];
    if (!enemy) return;

    const dist = bot.position.distanceTo(enemy.position);

    if (dist > 3) {
      // Move toward the enemy
      bot.sprint(true);
      bot.goto(enemy.position.x, enemy.position.y, enemy.position.z);
    } else {
      // Close enough — attack!
      bot.sprint(false);
      bot.attack();
    }
  },

  onDeath(bot: BotAPI) {
    console.log("Bot died!");
  },

  onChat(bot: BotAPI, sender: string, message: string) {
    console.log(`[Chat] ${sender}: ${message}`);
  },
};
