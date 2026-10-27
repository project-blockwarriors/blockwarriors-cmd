# Prizefight — manual testing guide

Everything below runs against the live stack (Convex `abundant-ferret-667` + the Fast Dev
Minecraft server). No local servers needed.

## 0. Prereqs (one time)

```bash
npm ci
```

Repo root `.env.local` must contain (already true on the main dev machine):

```
CONVEX_URL=https://abundant-ferret-667.convex.cloud
CONVEX_SITE_URL=https://abundant-ferret-667.convex.site
CONVEX_HTTP_SECRET=<secret>
MINECRAFT_HOST=hteng.blockwarriors.ai
MINECRAFT_PORT=25574
```

Health check before testing (all should return data / 200):

```bash
# Beacon alive? (should list 0 matches, success:true)
curl -s -H "Authorization: Bearer $CONVEX_HTTP_SECRET" \
  "https://abundant-ferret-667.convex.site/matches?status=Queuing"
# MC server reachable?
nc -z hteng.blockwarriors.ai 25574 && echo ok
```

## 1. Smoke test (no LLM, ~60s)

A scripted agent registers, fights tier0, and must WIN (exit code 0):

```bash
node packages/arena-mcp/scripts/play-demo.mjs
```

Expected: `FIGHT LIVE` within ~20s, `FINAL: { "outcome": "win", ... }` within ~60s,
Elo goes 1000 → ~1008, `tiers_cleared: ["tier0"]`.

## 2. The real thing — your agent plays via MCP

Add the server to Claude Code (or paste the JSON into Cursor / any MCP client):

```bash
claude mcp add prizefight -- node --import tsx \
  "$(pwd)/packages/arena-mcp/src/index.ts"
```

Then in a Claude session:

> Register as <YourHandle> in the prizefight arena, fight tier0, then try tier1.
> Narrate with arena_think before key actions and trash talk once with say.
> If you lose, analyze why from the observations and rematch with a better strategy.

Headless one-liner version:

```bash
claude -p "Register as TestFighter in the prizefight arena and beat tier0, then tier1. \
Use arena_think to narrate. Report your final Elo." \
  --allowedTools "mcp__prizefight__arena_register,mcp__prizefight__arena_status,mcp__prizefight__arena_fight,mcp__prizefight__arena_think,mcp__prizefight__look,mcp__prizefight__goto,mcp__prizefight__strike,mcp__prizefight__evade,mcp__prizefight__say,mcp__prizefight__match_result" \
  --max-turns 50
```

## 3. What to watch while a fight runs

- **Spectate page** (live 1Hz telemetry): the `spectate_url` returned by `arena_fight` —
  `https://blockwarriors.ai/dashboard/matches/<matchId>` (needs dashboard login).
- **Glass-box replay** (the action ticker, written when the match ends):
  `cat ~/.blockwarriors/replays/<matchId>.jsonl`
- **Ladder / records**: `cat ~/.blockwarriors/prizefight.json`
- **In-game**: join `hteng.blockwarriors.ai:25574` with a 1.20.6 client. Note: players who
  don't `/login` stay frozen in the lobby, so you'll see fighters pass through but can't follow
  them into the match world yet (public spectator mode is on the roadmap).
- **Queue state** (debugging a stuck fight):
  ```bash
  for s in Queuing Waiting Playing; do echo -n "$s: "; \
    curl -s -H "Authorization: Bearer $CONVEX_HTTP_SECRET" \
    "https://abundant-ferret-667.convex.site/matches?status=$s" | head -c 200; echo; done
  ```

## 4. Expected behaviors & known quirks

| Behavior | Why |
| --- | --- |
| ~10s between the two bot joins | server connection-throttle; gateway staggers connects 5s |
| Fighter IGNs get a random suffix (`Handle_a3f2`) | dodges Beacon's stale-login bug (see pivot doc) |
| `arena_fight` errors `ARENA_OFFLINE` | Beacon/MC server down — check the panel |
| `MATCH_OVER` from look/strike | the match already resolved; call `match_result` |
| tier1 Brawler is beatable but mean | rebalanced to 5s aggro tick after the 5-0 playtest |
| One active match per fighter | finish (or `match_result`) before re-queuing |

## 5. Reset between test sessions (optional)

```bash
rm -f ~/.blockwarriors/prizefight.json   # wipes ladder + fighter keys
rm -rf ~/.blockwarriors/replays          # wipes replays
```

Stale matches stuck in `Waiting` (e.g. after killing a fight mid-handshake) can be cleared with:

```bash
curl -s -X POST -H "Authorization: Bearer $CONVEX_HTTP_SECRET" -H "Content-Type: application/json" \
  "https://abundant-ferret-667.convex.site/matches/update" \
  -d '{"updates":[{"match_id":"<id>","match_status":"Terminated"}]}'
```
