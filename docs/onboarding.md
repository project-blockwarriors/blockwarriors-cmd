# Onboarding Guide for BlockWarriors

Welcome to the BlockWarriors project! This guide will help you get set up and ready to contribute.

## Project Overview

BlockWarriors Command Block is a monolithic repository for managing BlockWarriors tournaments and teams with the following components:

- **BlockWarriors Next.js Application**: A modern web dashboard for tournament and team management
- **BlockWarriors Socket.io Server**: Real-time communication server handling live updates and events

## Technology Stack

The project uses the following technologies:

### Frontend

- Next.js v15
- React v18
- TailwindCSS
- Radix UI Components

### Backend

- Next.js Server Actions/API Routes
- Express.js with Socket.io
- Minecraft Server (Paper/Spigot API)

### Authentication

- Google OAuth
- Email/Password

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/project-blockwarriors/blockwarriors-cmd.git
cd blockwarriors-cmd
```

#### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

#### Install Dependencies (Turborepo)

Run this once at the repository root.

```bash
# from repo root
npm install
```

### 2. Set Up Convex (Auth + Data)

Convex powers auth and backend queries/mutations. Set it up once and share across apps.

1. Initialize Convex (if not already):

   ```bash
   # First-time setup must be run from the backend package
   cd packages/backend
   npx convex dev
   ```

   When it prints the Convex onboarding link, open it and complete the setup.
   After the initial setup completes, stop the process (Ctrl+C). You can then
   run `npx convex dev` again whenever developing.

If it fails again here run the following two commands

```bash
npm i convex
npm i @convex-dev/better-auth
npm i uuid

npx convex dev
```

2. Configure Convex Environment Variables (Convex Cloud dashboard → Settings → Environment Variables):
   Set them using the CLI (recommended):

   ```bash
   npx convex env set GOOGLE_CLIENT_ID your_google_client_id
   npx convex env set GOOGLE_CLIENT_SECRET your_google_client_secret
   npx convex env set BETTER_AUTH_SECRET your_better_auth_secret
   npx convex env set SITE_URL http://localhost:3000
   # For production, set SITE_URL to your public site URL
   ```

   These are required because Convex auth (in `packages/backend/convex/auth.ts`) reads from `process.env` inside the Convex runtime.

3. Configure app environment variables that point to your Convex deployment:
   - Next.js app (`apps/blockwarriors-next/.env.local`):
     ```
     NEXT_PUBLIC_CONVEX_DEPLOYMENT=your-convex-deployment-name
     NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
     NEXT_PUBLIC_CONVEX_SITE_URL=http://your-deployment.convex.site
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```
   - Socket app (`apps/blockwarriors-socket/.env`):
     ```
     CONVEX_DEPLOYMENT=your-convex-deployment-name
     CONVEX_URL=https://your-deployment.convex.cloud
     ```

### 3. Run the Applications

#### Next.js Application

```bash
# from root repo
npm run dev
```

## Development Workflow

1. Create a feature branch following the naming convention:

   ```
   {first name initial}{lastname}-{feature}
   ```

   Example: `jdoe-login-page`

2. Make your changes and test them locally

3. Follow the [Contributing Guidelines](./contributing.md) for submitting your work

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.io Documentation](https://socket.io/docs)
- [Project Contributing Guide](./contributing.md)

## Need Help?

If you're stuck or have questions, reach out to the project maintainers or check the existing documentation in the repository.
