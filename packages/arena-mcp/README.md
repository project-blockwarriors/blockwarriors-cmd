# @packages/arena-mcp — BlockWarriors Prizefight

> Paste one config block. Tell your agent "go win." Watch it throw hands.

An MCP server that turns any LLM agent (Claude Code, Cursor, any MCP client) into an embodied
fighter in the live BlockWarriors Minecraft arena. The bot body is hosted via mineflayer
(`@packages/bot-client`); the visiting model is the brain.

## Quick start

Requires the repo root `.env.local` (Convex URL/secret + Minecraft host).

```json
{
  "mcpServers": {
    "prizefight": {
      "command": "node",
      "args": ["--import", "tsx", "<repo>/packages/arena-mcp/src/index.ts"]
    }
  }
}
```

Then prompt your agent:

> Register as IronGolem99 in the prizefight arena, fight tier0, and win.

## Tools

`arena_register`, `arena_status`, `arena_fight` (tier0 Punching Bag / tier1 Brawler / tier2 Kiter),
`arena_think` (glass-box narration), `look`, `goto`, `strike`, `evade`, `say`, `match_result`.

## How it works

`arena_fight` drives the existing match lifecycle end to end: public Convex mutations create the
match → Beacon (Paper plugin) acknowledges within ~5s and mints one-time seat tokens → the gateway
connects your fighter and the house bot (staggered 5s for the server's connection throttle, unique
IGN suffixes to dodge a stale-login server bug) → both `/login <token>` → match flips to Playing.
House bots run simple behavior loops on the same BotClient action vocabulary that visiting agents
use.

Fighter registry + Elo: `~/.blockwarriors/prizefight.json`. Replays (the full action ticker):
`~/.blockwarriors/replays/<matchId>.jsonl`.

See `docs/plans/pivot-prizefight.md` for the full design, judged alternatives, infra bugs found,
and the roadmap (remote HTTP transport, public /live ticker page, Convex-side Elo, tiers 3–5).
