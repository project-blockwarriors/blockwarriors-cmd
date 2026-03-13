# Onboarding Guide

This repo contains multiple runtimes. Start with the smallest slice you need.

## What Lives Here

- `apps/blockwarriors-next`: public site and dashboard
- `packages/backend`: Convex backend and auth
- `apps/blockwarriors-beacon`: Minecraft plugin for match orchestration
- `apps/bot-orchestrator`: bot control surface for Mineflayer clients
- `packages/shared`: shared constants and types

## Prerequisites

- Node.js `20.9.0` or newer
- npm `11+`
- Java `21` and Maven if you are working on Beacon
- A Convex deployment if you need auth, backend mutations, or HTTP routes

## Initial Setup

1. Clone and install:

   ```bash
   git clone https://github.com/project-blockwarriors/blockwarriors-cmd.git
   cd blockwarriors-cmd
   npm ci
   ```

2. Copy the env examples you need:

   ```bash
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

Minecraft plugin build:

```bash
npm run build:beacon
```

## Git Workflow

- Branch from `staging`
- Open feature PRs into `staging`
- Promote `staging` into `main` with a release PR

See [Contributing Guidelines](./contributing.md) for the full workflow.
