// Drives the Prizefight MCP server through a full tier0 fight as a scripted agent.
// Usage: node packages/arena-mcp/scripts/play-demo.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.resolve(__dirname, "..", "src", "index.ts");

const t0 = Date.now();
const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1) + "s", ...a);

const transport = new StdioClientTransport({
  command: "node",
  args: ["--import", "tsx", serverEntry],
  stderr: "inherit",
});
const client = new Client({ name: "demo-agent", version: "0.0.1" });
await client.connect(transport);
log("connected to MCP server");

const call = async (name, args) => {
  const res = await client.callTool({ name, arguments: args });
  const text = res.content?.[0]?.text ?? "{}";
  const data = JSON.parse(text);
  log(`${name} ->`, JSON.stringify(data).slice(0, 220));
  if (res.isError) throw new Error(`${name}: ${text.slice(0, 300)}`);
  return data;
};

const tools = await client.listTools();
log("tools:", tools.tools.map((t) => t.name).join(", "));

const reg = await call("arena_register", { handle: "DemoSlugger" });
const key = reg.fighter_key;

const fight = await call("arena_fight", { fighter_key: key, opponent: "tier0" });
const matchId = fight.match_id;
log("FIGHT LIVE", matchId, "spectate:", fight.spectate_url);

await call("arena_think", { match_id: matchId, thought: "Find the bag, close distance, swing until it drops." });

let obs = await call("look", { match_id: matchId });
let target = obs.entities?.find((e) => e.isPlayer);
if (!target) {
  await call("goto", { match_id: matchId, x: obs.you.position.x + 5, y: obs.you.position.y, z: obs.you.position.z });
  obs = await call("look", { match_id: matchId });
  target = obs.entities?.find((e) => e.isPlayer);
}
if (!target) throw new Error("no opponent visible");

await call("say", { match_id: matchId, message: "You are about to get folded, bag." });

// keep striking until the match resolves (tier0 = ~20 fist hits)
for (let round = 1; round <= 12; round++) {
  try {
    obs = await call("strike", { match_id: matchId, entity_id: target.id });
    const t = obs.entities?.find((e) => e.isPlayer);
    if (t) target = t;
  } catch (e) {
    log("strike ended:", String(e.message).slice(0, 120));
    break;
  }
  const result = await call("match_result", { fighter_key: key, match_id: matchId });
  if (result.status === "finished") break;
}

let final = await call("match_result", { fighter_key: key, match_id: matchId });
for (let i = 0; i < 20 && final.status !== "finished"; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  final = await call("match_result", { fighter_key: key, match_id: matchId });
}
log("FINAL:", JSON.stringify(final, null, 1));
const status = await call("arena_status", { fighter_key: key });
log("PROFILE:", JSON.stringify(status));

await client.close();
process.exit(final.outcome === "win" ? 0 : 1);
