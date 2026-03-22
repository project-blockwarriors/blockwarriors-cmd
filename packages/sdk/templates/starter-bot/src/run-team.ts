import { BlockWarriorsBot } from "@blockwarriors/sdk";
import { myStrategy } from "./my-bot.js";

/**
 * Team launcher — runs multiple bots for team games (4v4).
 *
 * Usage:
 *   npm run team -- --host <host> --port <port> --tokens TOKEN1,TOKEN2,TOKEN3,TOKEN4
 */

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const host = getArg("host") || process.env.HOST || "play.blockwarriors.ai";
const port = parseInt(getArg("port") || process.env.PORT || "25565", 10);
const tokensStr = getArg("tokens") || process.env.TOKENS;

if (!tokensStr) {
  console.error("Usage: npm run team -- --host <host> --port <port> --tokens TOKEN1,TOKEN2,TOKEN3,TOKEN4");
  process.exit(1);
}

const tokens = tokensStr.split(",").map((t) => t.trim());
console.log(`Launching ${tokens.length} bots on ${host}:${port}...`);

const bots: BlockWarriorsBot[] = [];

async function launchBots() {
  for (let i = 0; i < tokens.length; i++) {
    const ign = `Bot${i + 1}`;
    console.log(`[${i + 1}/${tokens.length}] Connecting ${ign}...`);

    const bot = new BlockWarriorsBot({
      host,
      port,
      ign,
      token: tokens[i],
      strategy: myStrategy,
    });

    await bot.start();
    bots.push(bot);

    // 5-second delay between connections to avoid throttling
    if (i < tokens.length - 1) {
      console.log("  Waiting 5s before next connection...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log(`All ${tokens.length} bots connected and running!`);
}

launchBots().catch((err) => {
  console.error("Failed to launch bots:", err.message);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\nShutting down all bots...");
  bots.forEach((bot) => bot.stop());
  process.exit(0);
});
