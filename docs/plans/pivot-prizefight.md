# BlockWarriors Prizefight — the 2026 pivot

> Paste one config block. Tell your agent "go win." Watch it throw hands.

## Why pivot

Three blockers killed the original tournament platform (full analysis: workflow synthesis, June 2026):

1. **Developer experience** — no local loop: every test needed live Convex + a live MC server with a
   Maven jar pushed through Pterodactyl; env sprawl across 5 files + out-of-band secrets; three
   conflicting "sources of truth" for game types.
2. **Game design** — the entry path was *hand-writing mineflayer pathfinding code* (pre-2023 tech,
   zero LLM surface); ELO displayed but never computed; nothing to spectate.
3. **Playability** — hours to first match: Google auth → profile → **mandatory team** → tokens →
   clone repo → Node setup. The SDK was never even published.

2026 hackathon reality (researched): people build **agents**, MCP is the default integration
standard, non-engineers vibe-code, and the engagement loops that work are visible-reasoning
spectacle (Claude Plays Pokemon), blind model-vs-model voting (LMArena/MC-Bench), and persistent
ladders (Battlesnake).

## The game

**Prizefight** is an MCP-native Minecraft fight ladder. Any Claude/Cursor/agent-framework user adds
one MCP server and their agent becomes an embodied fighter in a live PvP arena — no signup, no
team, no npm install, no mineflayer. The bot body is hosted (our BotClient on our fleet); the
visiting LLM is the brain, driving it through ~10 tools.

- **The Gauntlet**: ladder of escalating house bots — tier0 Punching Bag → tier1 Brawler →
  tier2 Kiter → (tier3 Duelist → tier4 Warden → tier5 a Claude-driven Champion playing the same
  tool surface).
- **Ranked duels**: real Elo (K=32), your agent vs other people's agents.
- **The meta-loop is the game**: your agent loses to the Kiter → you read the action ticker →
  edit your agent's prompt → rematch in 90 seconds. Prompt engineering as a fighting game.
- **Glass box (judge-panel graft)**: every tool call + `arena_think` narration streams to a
  spectator ticker beside the live map — watch the AI think and fight simultaneously.
- Later grafts (judged valuable): prediction-voting while you queue, blind "Mind A vs Mind B"
  exhibition reveals, phone-tier Prompt Golf (entry = a system prompt, run by a house runner),
  dual-rated house bots (tier Elo moves too → self-calibrating difficulty + citable benchmark curve).

Unanimous judge-panel winner (3/3) over social-deduction (Witch Trials), streamed-league
(Beacon Bowl), crowd build-voting (Blind Build), and human-built-vaults (VAULTED) designs.

## What exists today (`packages/arena-mcp`)

MCP server (stdio) wrapping the **unchanged** existing infra — zero edits to Convex functions,
Beacon jar, or the web app:

| Tool | What it does |
| --- | --- |
| `arena_register(handle)` | fighter_key + Elo 1000 + rules |
| `arena_status(fighter_key)` | record, tiers cleared, ladder top-20 |
| `arena_fight(fighter_key, tier0\|tier1\|tier2)` | creates match via public Convex mutations → waits for Beacon ack → claims both seat tokens → connects your bot + the house bot → returns when status=Playing, with spectate_url |
| `arena_think(match_id, thought)` | glass-box narration → action ticker |
| `look(match_id)` | position/health/inventory + entities ≤32 blocks |
| `goto(match_id,x,y,z)` | pathfind, returns on arrival with fresh observation |
| `strike(match_id, entity_id)` | 30s chase-and-hit combat session |
| `evade(match_id)` | sprint away from nearest enemy player |
| `say(match_id, message)` | arena chat (trash talk encouraged) |
| `match_result(fighter_key, match_id)` | outcome + Elo delta + tier unlock + ticker tail |

State: fighter registry/Elo in `~/.blockwarriors/prizefight.json`; replays (full action log) in
`~/.blockwarriors/replays/<matchId>.jsonl`. Reads root `.env.local` for Convex/MC endpoints.

Entry (today, local): add to any MCP client —

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

## Live-infra bugs found while building (with workarounds in the gateway)

1. **Connection throttle** — the MC server kicks a second same-IP join within ~4s
   ("Connection throttled!"). Gateway serializes connects with a 5s gap. Proper fix:
   `connection-throttle: -1` in bukkit.yml via Pterodactyl.
2. **Stale-login race (Beacon bug)** — `LoginCommand`'s async `/validateToken` callback can add a
   player to `loggedInPlayers` *after* PlayerQuitEvent cleanup runs (e.g. process died mid-login).
   The offline-mode UUID is name-derived, so that name is then **permanently** "already logged in"
   and its token never gets consumed → match stuck in `Waiting` forever. Gateway dodges it with
   unique per-match IGN suffixes. Proper fix: re-check `player.isOnline()` in the callback +
   clear stale entries on PlayerJoinEvent.
3. **Hostile lobby** — bots waiting for match start get killed by zombies in the lobby world
   (observed: "slain by Zombie" ×3 while frozen pre-login). Harmless once login is fast, but the
   lobby should be peaceful/protected.
4. **Stuck `Waiting` matches never expire** — the cron only reaps `Queuing`. A March match was
   still `Waiting` in June. Needs a `Waiting`-timeout in `convex/crons.ts`.
5. **`/matches/new` HTTP route requires a user JWT** — server-to-server creation goes through the
   public mutations instead (`gameTeams:createGameTeamsForMatch` + `matches:createMatch`), same as
   `packages/game-tests`.

## Hosting/ops state (June 10, 2026)

- **blockwarriors.ai apex + www: broken upstream** — A records point at Cloudflare's own proxy IPs
  (Error 1000 "DNS points to prohibited IP"); zone lives in the Ibraheem.amin3 Cloudflare account.
  The provided `cfat_` token has Zone:Read + Workers:Edit but **no DNS edit** (verified: 10000 auth
  error on dns_records read/write), so the two bad A records can't be deleted programmatically yet.
- **Workaround shipped**: site deployed to Vercel (`blockwarriors-next` under diodides-projects,
  monorepo rootDirectory=apps/blockwarriors-next) + a `blockwarriors-web` Cloudflare Worker
  proxying to it, with **`app.blockwarriors.ai`** attached as a Workers custom domain → the site
  is live there now.
- **To fix the apex** (2 min in dash): delete the `A blockwarriors.ai` and `A/CNAME www` records,
  then either attach both hostnames to the `blockwarriors-web` worker (one API call each) or point
  apex `A 76.76.21.21` / `www CNAME cname.vercel-dns.com` (DNS-only) at Vercel and add the domains
  to the Vercel project.
- **mcpanel.blockwarriors.ai TLS cert expired May 31** (Let's Encrypt renew broken; needs SSH to
  147.93.144.226 → `certbot renew`). Panel API still works with `-k`.
- MC server fleet healthy: "Fast Dev - Ibraheem" running 79 days, game host
  `hteng.blockwarriors.ai:25574` reachable, Beacon polling (ack in ~3s).

## Playtest log (2026-06-10, all against live infra)

1. **Scripted agent** (`scripts/play-demo.mjs`): register → match LIVE at 14.7s → tier0 KO at
   29.7s → win, Elo 1000→1008, tier0 cleared, full action ticker captured. Time-to-first-dopamine
   < 30s (vs hours pre-pivot).
2. **Real LLM** (headless Claude Code with the MCP config + a one-paragraph prompt): registered as
   ClaudeBrawler, narrated with `arena_think` ("The Brawler never retreats — so I won't either"),
   trash-talked in-game ("I'm about to rename you the Crawler 🥊"), fought 6 full matches with
   autonomous loss-analysis and rematches. Final: 1W-5L, Elo 928, tier0 cleared.
   - The prompt-edit-rematch meta-loop emerged unprompted: after losing it diagnosed ("no speeches
     this time"), changed strategy, and re-queued.
   - tier1 was overtuned (always-aggro 2.5s loop vs LLM decision latency went 5-0) → rebalanced to
     5s tick + 12-block aggro. First-rung house bots must be winnable.
   - Live server fix applied: lobby zombies were eating queued fighters (entering matches at
     15/20 HP) → `difficulty peaceful` + `doMobSpawning false` via Pterodactyl console on
     Fast Dev (e0e3c096).
   - 3 stuck `Waiting` matches (incl. one from March) terminated via `/matches/update`.

## Roadmap

- **Week 1**: remote HTTP transport at `mcp.blockwarriors.ai` (Workers/Node host) so entry is a URL
  paste, not a repo clone; public no-auth `/live/[matchId]` page = existing telemetry map + the
  action ticker (ship the replay JSONL through Convex); Elo + fighters table in Convex
  (~30 lines, the rating logic the schema always promised); tiers 3–5; Beacon bug fixes above.
- **Season 1**: ranked duels matchmaking, prediction-voting, blind exhibition reveals,
  hackathon kit (QR → config block → "go win"), Claude Builder Club pilot event.
