# BlockWarriors Command Block

BlockWarriors is a monorepo for the tournament platform, Convex backend, and Minecraft integrations used by the project.

## Active Packages

- `apps/blockwarriors-next`: Next.js 16 dashboard and public site
- `packages/backend`: Convex functions, HTTP routes, auth, schema, and seed helpers
- `apps/blockwarriors-beacon`: Minecraft/Paper plugin for match orchestration
- `apps/bot-orchestrator`: Mineflayer bot control UI and socket server
- `packages/shared`: Shared TypeScript constants and types

## Quick Start

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy the example env files for the runtimes you need:
   - `apps/blockwarriors-next/.env.example`
   - `packages/backend/.env.example`
   - `apps/bot-orchestrator/.env.example`
   - `apps/blockwarriors-beacon/.env.example`
   - `.env.example` if you want to use Beacon deploy automation
3. Generate the Beacon game config from the shared JSON source:
   ```bash
   npm run codegen:beacon
   ```
4. Start the stack you need:
   ```bash
   npm run dev
   ```

Use targeted commands if you only need part of the stack:

- `npm run dev:web`
- `npm run dev:backend`
- `npm run dev:bot-orchestrator`

## Common Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run deploy:beacon`
- `npm run deploy:beacon:dry-run`
- `npm run validate`
- `npm run test:http`

## Branch Flow

Day-to-day work flows through `staging`, not directly into `main`.

- Feature branches target `staging`
- Release PRs promote `staging` into `main`

## Documentation

- [Onboarding Guide](./docs/onboarding.md)
- [Beacon Deploy Guide](./docs/beacon-deploy.md)
- [Technology Stack](./docs/stack.md)
- [Match System Architecture](./docs/match-system-architecture.md)
- [Build UHC Game](./docs/games/builduhc.md)
- [Contributing Guidelines](./docs/contributing.md)
