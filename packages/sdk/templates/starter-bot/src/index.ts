import { BlockWarriorsBot } from "@blockwarriors/sdk";
import { myStrategy } from "./my-bot.js";

// Parse CLI arguments
const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const host = getArg("host") || process.env.HOST || "play.blockwarriors.ai";
const port = parseInt(getArg("port") || process.env.PORT || "25565", 10);
const ign = getArg("ign") || process.env.IGN;
const token = getArg("token") || process.env.TOKEN;

if (!ign || !token) {
  console.error("Usage: npm start -- --host <host> --port <port> --ign <name> --token <token>");
  console.error("  or set IGN and TOKEN environment variables");
  process.exit(1);
}

console.log(`Connecting ${ign} to ${host}:${port}...`);

const bot = new BlockWarriorsBot({
  host,
  port,
  ign,
  token,
  strategy: myStrategy,
});

bot.start().catch((err) => {
  console.error("Failed to start bot:", err.message);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  bot.stop();
  process.exit(0);
});
