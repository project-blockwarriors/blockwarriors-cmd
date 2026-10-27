#!/usr/bin/env node
// BlockWarriors Prizefight — MCP gateway.
// Paste one config block, tell your agent "go win", watch it throw hands.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config as dotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ArenaGateway, ArenaError } from "./gateway.js";
import { TIERS } from "./houseBots.js";
import { registerFighter, getFighter, getLadder, recordResult } from "./state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
dotenv({ path: path.join(repoRoot, ".env.local") });
dotenv({ path: path.join(repoRoot, ".env") });

const gateway = new ArenaGateway({
  convexUrl: process.env.CONVEX_URL || "https://abundant-ferret-667.convex.cloud",
  convexSiteUrl: process.env.CONVEX_SITE_URL || "https://abundant-ferret-667.convex.site",
  convexHttpSecret: process.env.CONVEX_HTTP_SECRET || "",
  minecraftHost: process.env.MINECRAFT_HOST || "hteng.blockwarriors.ai",
  minecraftPort: parseInt(process.env.MINECRAFT_PORT || "25574", 10),
  spectateBaseUrl: process.env.SPECTATE_BASE_URL || "https://app.blockwarriors.ai",
});

const RULES = `PRIZEFIGHT RULES
- 1v1 PvP in a disposable arena. Win by taking your opponent to 0 HP.
- If a fighter disconnects, the survivor wins (forfeit).
- Climb the gauntlet: ${Object.values(TIERS).map((t) => `${t.id}=${t.name} (Elo ${t.elo})`).join(", ")}.
- Glass box: every tool call is logged to the public action ticker. Use arena_think to narrate strategy — spectators see it live.
- Etiquette: say() trash talk is encouraged.`;

const server = new McpServer({ name: "blockwarriors-prizefight", version: "0.1.0" });

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] });
const fail = (e: unknown) => {
  if (e instanceof ArenaError) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: e.code, message: e.message, retry_after_s: e.retryAfterS }) }], isError: true };
  }
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: "INTERNAL", message: String(e) }) }], isError: true };
};

server.registerTool(
  "arena_register",
  {
    description: "Register as a fighter in the BlockWarriors Prizefight arena. Returns your fighter_key (keep it for all other calls), starting Elo, and the rules.",
    inputSchema: { handle: z.string().min(2).max(20).describe("Your fighter handle, e.g. IronGolem99") },
  },
  async ({ handle }) => {
    try {
      const f = registerFighter(handle);
      return ok({ fighter_key: f.fighterKey, handle: f.handle, elo: f.elo, record: `${f.wins}W-${f.losses}L`, tiers_cleared: f.tiersCleared, rules: RULES });
    } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "arena_status",
  {
    description: "Your fighter profile, active match (if any), and the top of the Elo ladder.",
    inputSchema: { fighter_key: z.string() },
  },
  async ({ fighter_key }) => {
    try {
      const f = getFighter(fighter_key);
      if (!f) throw new ArenaError("UNKNOWN_FIGHTER", "Register first with arena_register");
      return ok({ handle: f.handle, elo: f.elo, record: `${f.wins}W-${f.losses}L-${f.draws}D`, tiers_cleared: f.tiersCleared, ladder: getLadder() });
    } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "arena_fight",
  {
    description: "Enter a match. Creates the arena, spawns your fighter and the opponent, returns when the fight is LIVE. Opponents: tier0 (Punching Bag), tier1 (Brawler), tier2 (Kiter). Then use look/goto/strike/evade/say to fight, and arena_think to narrate.",
    inputSchema: {
      fighter_key: z.string(),
      opponent: z.enum(["tier0", "tier1", "tier2"]).describe("Gauntlet tier to challenge"),
    },
  },
  async ({ fighter_key, opponent }) => {
    try {
      const f = getFighter(fighter_key);
      if (!f) throw new ArenaError("UNKNOWN_FIGHTER", "Register first with arena_register");
      const s = await gateway.createFight(f, opponent);
      return ok({
        match_id: s.matchId,
        you: s.playerIgn,
        opponent: `${s.tier.name} (Elo ${s.tier.elo}) — ${s.tier.description}`,
        spectate_url: s.spectateUrl,
        rules: RULES,
        hint: "Start with look(match_id) to find your opponent, then strike(match_id, entity_id).",
      });
    } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "arena_think",
  {
    description: "Narrate your strategy before acting (REQUIRED etiquette in ranked). Spectators see this beside the live match — never leave the ticker silent.",
    inputSchema: { match_id: z.string(), thought: z.string().max(280) },
  },
  async ({ match_id, thought }) => {
    try {
      gateway.think(match_id, thought);
      return ok({ logged: true });
    } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "look",
  {
    description: "Survey the arena: your position/health and all entities within 32 blocks (your opponent is the other player).",
    inputSchema: { match_id: z.string() },
  },
  async ({ match_id }) => {
    try { return ok(gateway.look(match_id)); } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "goto",
  {
    description: "Pathfind to coordinates. Returns when you arrive (or after 10s) with a fresh observation.",
    inputSchema: { match_id: z.string(), x: z.number(), y: z.number(), z: z.number() },
  },
  async ({ match_id, x, y, z: zc }) => {
    try { return ok(await gateway.goto(match_id, x, y, zc)); } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "strike",
  {
    description: "Chase and attack an entity (30s auto-combat session: pathfinds to the target and swings every 0.5s in range). Get entity_id from look().",
    inputSchema: { match_id: z.string(), entity_id: z.number() },
  },
  async ({ match_id, entity_id }) => {
    try { return ok(await gateway.strike(match_id, entity_id)); } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "evade",
  {
    description: "Sprint away from the nearest enemy player. Use when low on health.",
    inputSchema: { match_id: z.string() },
  },
  async ({ match_id }) => {
    try { return ok(await gateway.evade(match_id)); } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "say",
  {
    description: "Talk in the arena chat. Trash talk is part of the sport.",
    inputSchema: { match_id: z.string(), message: z.string().max(100) },
  },
  async ({ match_id, message }) => {
    try {
      await gateway.say(match_id, message);
      return ok({ sent: true });
    } catch (e) { return fail(e); }
  }
);

server.registerTool(
  "match_result",
  {
    description: "Final (or current) result of a match. Applies Elo and tier unlocks once the match is over.",
    inputSchema: { fighter_key: z.string(), match_id: z.string() },
  },
  async ({ fighter_key, match_id }) => {
    try {
      const f = getFighter(fighter_key);
      if (!f) throw new ArenaError("UNKNOWN_FIGHTER", "Register first with arena_register");
      const s = gateway.getSession(match_id);
      if (s.status === "playing") {
        return ok({ status: "playing", elapsed_s: Math.round((Date.now() - s.startedAt) / 1000), hint: "Fight is still live — keep going." });
      }
      if (!s.result) throw new ArenaError("NO_RESULT", "Match ended without a result");
      if (s.result.eloDelta === undefined) {
        const { elo, eloDelta } = recordResult(fighter_key, match_id, s.tier.name, s.tier.elo, s.result.outcome, s.tier.id);
        s.result.eloDelta = eloDelta;
        return ok({ status: "finished", outcome: s.result.outcome, detail: s.result.detail, elo, elo_delta: eloDelta, tiers_cleared: getFighter(fighter_key)!.tiersCleared, action_log_tail: s.actionLog.slice(-10) });
      }
      return ok({ status: "finished", outcome: s.result.outcome, detail: s.result.detail, elo: f.elo, elo_delta: s.result.eloDelta, action_log_tail: s.actionLog.slice(-10) });
    } catch (e) { return fail(e); }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[prizefight] MCP gateway ready");

process.on("SIGINT", async () => {
  await gateway.shutdown();
  process.exit(0);
});
