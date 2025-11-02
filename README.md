# BlockWarriors Command Block

Welcome to the BlockWarriors Command Block! This is a monolithic repository for managing BlockWarriors tournaments and teams.

## Applications

### BlockWarriors Command Block - Next.js Application

A modern web dashboard for BlockWarriors tournament and team management.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Radix UI, Convex, Better Auth, Socket.io client

### BlockWarriors Command Block - Socket.io Server

Real-time communication server handling live updates and events.

**Tech Stack:** Node.js with Express, Socket.io for WebSocket communication, Convex

## Convex Setup

Convex is configured at the root level to enable shared types across all services. To get started:

1. Install dependencies at the root:

   ```bash
   npm install
   ```

2. Initialize Convex (if not already done):

   ```bash
   npx convex dev
   ```

3. Set up environment variables:
   - Create `.env.local` in the root directory
   - Add your Convex deployment URL:
     ```
     CONVEX_URL=https://your-deployment.convex.cloud
     NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
     ```

4. Generate types:

   ```bash
   npm run convex:codegen
   ```

5. Use Convex in your projects:
   - **Next.js**: Import from `src/lib/convex.ts`
   - **Socket**: Import from `convexClient.js`

## Documentation

For detailed information about the project, please refer to our documentation in the [docs](./docs) directory:

- [Onboarding Guide](./docs/onboarding.md) - Get started with the project
- [Technology Stack](./docs/stack.md) - Detailed architecture and technology stack
- [Contributing Guidelines](./docs/contributing.md) - Learn how to contribute
