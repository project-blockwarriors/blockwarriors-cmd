# Onboarding Guide

This repo contains multiple runtimes. Start with the smallest slice you need.

## What Lives Here

| Package | Purpose |
|---------|---------|
| `apps/blockwarriors-next` | Public site and dashboard (Next.js 16) |
| `packages/backend` | Convex backend — auth, schema, HTTP routes, seeds |
| `apps/blockwarriors-beacon` | Minecraft/Paper plugin for match orchestration |
| `apps/bot-orchestrator` | Mineflayer bot control UI and socket server |
| `packages/shared` | Shared TypeScript constants, types, and `game-config.json` |
| `packages/bot-client` | Mineflayer bot client library (used by game tests and orchestrator) |
| `packages/sdk` | Player SDK with starter bot template |
| `packages/game-tests` | Automated end-to-end game test harness |

## Prerequisites

- **Node.js 22** (see `.nvmrc` — required by `minecraft-protocol`)
- **npm 11+**
- **Java 21** and **Maven** if you are working on the Beacon plugin
- A **Convex deployment** if you need auth, backend mutations, or HTTP routes
- A **Pterodactyl panel account** on `mcpanel.blockwarriors.ai` if you need to deploy or test against a Minecraft server

## Initial Setup

1. Clone and install:

   ```bash
   git clone https://github.com/project-blockwarriors/blockwarriors-cmd.git
   cd blockwarriors-cmd
   nvm install    # reads .nvmrc → installs Node 22
   npm ci
   ```

2. Copy the env examples you need:

   ```bash
   cp .env.example .env.local
   cp apps/blockwarriors-next/.env.example apps/blockwarriors-next/.env.local
   cp packages/backend/.env.example packages/backend/.env.local
   cp apps/bot-orchestrator/.env.example apps/bot-orchestrator/.env.local
   cp apps/blockwarriors-beacon/.env.example apps/blockwarriors-beacon/.env.local
   ```

3. Generate Beacon constants from the shared JSON config:

   ```bash
   npm run codegen:beacon
   ```

## Convex Setup

Convex powers auth, backend queries/mutations, and the HTTP routes used by the dashboard and Beacon plugin.

1. Initialize the backend package once:

   ```bash
   npm run dev:backend
   ```

   Complete the Convex onboarding flow the first time it prompts you.

2. Set the required Convex deployment env vars:

   ```bash
   npx convex env set SITE_URL http://localhost:3000
   npx convex env set GOOGLE_CLIENT_ID your_google_client_id
   npx convex env set GOOGLE_CLIENT_SECRET your_google_client_secret
   npx convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
   npx convex env set CONVEX_HTTP_SECRET $(openssl rand -base64 32)
   npx convex env set CONVEX_SITE_URL https://your-deployment.convex.site
   ```

3. Update local app env files with your deployment values:
   - `apps/blockwarriors-next/.env.local`
   - `packages/backend/.env.local`
   - `apps/blockwarriors-beacon/.env.local`

## Minecraft Server Setup (Pterodactyl)

Each developer has their own "Fast Dev" Minecraft server managed through the Pterodactyl panel at `https://mcpanel.blockwarriors.ai`.

### 1. Get panel access

Ask your team lead for an account on the panel. Once logged in, you should see your assigned "Fast Dev - YourName" server.

### 2. Get a Pterodactyl Client API Key

1. Log in to `https://mcpanel.blockwarriors.ai`
2. Click your avatar → **Account Settings** → **API Credentials**
3. Create a new key — it will start with `ptlc_`

### 3. Configure deploy automation

Add these to your root `.env.local`:

```
PTERODACTYL_PANEL_URL=https://mcpanel.blockwarriors.ai
PTERODACTYL_API_KEY=ptlc_your_client_api_key
PTERODACTYL_SERVER_NAME=Fast Dev - YourName
CONVEX_SITE_URL=https://your-deployment.convex.site
CONVEX_HTTP_SECRET=your-convex-http-secret
```

Verify your server is visible:

```bash
npm run deploy:beacon -- --list-servers
```

### 4. Build and deploy the Beacon plugin

```bash
npm run deploy:beacon
```

This builds the JAR, uploads it to your server, syncs `config.yml` with your Convex settings, and restarts the server. See [Beacon Deploy Guide](./beacon-deploy.md) for all options.

### 5. Verify the server

After the server restarts, connect with a Minecraft client or check the panel console. The Beacon plugin should log its startup and begin polling Convex for queued matches.

## Game Types and Arenas

Games are configured in `packages/shared/constants/game-config.json` (the single source of truth) and arena layouts live in `apps/blockwarriors-beacon/src/main/resources/arenas/`.

| Game Type | Players | Arena File | Description |
|-----------|---------|------------|-------------|
| `pvp` | 1v1 | `arenas/pvp.yml` | Classic PvP combat |
| `bridge` | 1v1 | `arenas/bridge.yml` | Two platforms over void — score by entering enemy goal |
| `ctf` | 4v4 | `arenas/ctf.yml` | Capture the flag with respawns |

Each arena YAML defines spawn points, boundaries, objectives, and special blocks. To test arenas in-game without Convex, use the debug commands (requires `beacon.debug` permission):

```
/setarena pvp           # Load the PvP arena
/testgame pvp Player1 Player2   # Start a local test match
/endgame blue           # Force end with blue as winner
/triggerobjective score player1 team=blue  # Simulate objective
```

When you change `game-config.json`, regenerate the Java constants:

```bash
npm run codegen:beacon
```

## Running Automated Game Tests

The `packages/game-tests` package runs end-to-end game scenarios against a live Minecraft server and Convex backend. Tests create matches via the Convex API, spawn Mineflayer bots that connect to the server, execute scripted behaviors, and verify the match completes with the expected result.

### Prerequisites

- A running Minecraft server with the Beacon plugin deployed (see above)
- A Convex backend deployment
- Node 22

### Environment

The test runner reads from root `.env.local` (or `.env`):

```
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=https://your-deployment.convex.site
CONVEX_HTTP_SECRET=your-convex-http-secret
MINECRAFT_HOST=mcpanel.blockwarriors.ai
MINECRAFT_PORT=25565
```

`MINECRAFT_HOST` defaults to `mcpanel.blockwarriors.ai` and `MINECRAFT_PORT` defaults to `25565` if not set.

### Running tests

Run all scenarios:

```bash
npm run test:game
```

Run a specific scenario by name filter:

```bash
npm run test:game pvp
npm run test:game bridge
npm run test:game ctf
npm run test:game tournament
```

### Available scenarios

| Scenario | What it tests |
|----------|---------------|
| `pvp-1v1` | Full PvP match lifecycle — blue attacks, red forfeits via disconnect, blue wins |
| `bridge-1v1` | Bridge match — blue rushes, red forfeits, blue wins |
| `ctf-4v4` | CTF match with 8 bots — attackers and defenders, one team forfeits |
| `tournament-flow` | Creates a tournament, joins teams, generates bracket, plays a match through to completion |

### How it works

Each scenario follows this lifecycle:

1. **Create match** — creates game teams and a match in Convex (status: `Queuing`)
2. **Wait for acknowledgment** — Beacon plugin polls Convex, acknowledges the match, generates tokens (status: `Waiting`)
3. **Retrieve tokens** — fetches the login tokens for each bot
4. **Spawn bots** — connects Mineflayer bots to the Minecraft server, sends `/login <token>` for each
5. **Wait for match start** — all tokens used → match transitions to `Playing`
6. **Execute bot scripts** — each bot runs its assigned behavior (attack, forfeit, rush, defend, etc.)
7. **Wait for finish** — match reaches `Finished` status
8. **Assert result** — verifies winner, final status, etc.

### Bot scripts

Scripts in `packages/game-tests/src/scripts/` define bot behaviors:

| Script | Behavior |
|--------|----------|
| `pvp-attack` | Attacks nearest opponent |
| `pvp-forfeit` | Waits then disconnects (triggers forfeit) |
| `bridge-rush` | Moves toward enemy goal |
| `bridge-forfeit` | Waits then disconnects |
| `ctf-attacker` | Moves toward enemy flag |
| `ctf-defender` | Stays near own flag |
| `ctf-forfeit` | Waits then disconnects |

### Troubleshooting

- **"CONVEX_URL is not set"** — make sure your root `.env.local` has the Convex deployment URL
- **Bots fail to connect** — check that the Minecraft server is online and the host/port are correct; the server may throttle rapid connections
- **Match stuck in Queuing** — the Beacon plugin isn't running or can't reach Convex; check the server console
- **Timeout waiting for Finished** — the game may need longer; increase `finishTimeoutMs` in the scenario, or check if the arena is properly loaded on the server

## Day-To-Day Commands

Run the full JS stack:

```bash
npm run dev
```

Run individual surfaces:

```bash
npm run dev:web
npm run dev:backend
npm run dev:bot-orchestrator
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm run test
npm run validate
```

Build and deploy:

```bash
npm run build:beacon          # Build Beacon JAR
npm run deploy:beacon         # Build + upload + restart server
npm run deploy:beacon:dry-run # Preview without changes
npm run test:game             # Run automated game tests
npm run test:http             # Run HTTP route tests
```

## Git Workflow

- Branch from `staging`
- Open feature PRs into `staging`
- Promote `staging` into `main` with a release PR

See [Contributing Guidelines](./contributing.md) for the full workflow.
