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
- Supabase (PostgreSQL, Auth, Storage)
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

### 2. Set Up Next.js Application

Navigate to the Next.js application directory:

```bash
cd blockwarriors-next
```

#### Prerequisites

- Node.js (Latest LTS version recommended)
- Docker (for Supabase local development)
- Supabase CLI
- npm or yarn

#### Install Dependencies

```bash
npm install
# or
yarn
```

#### Set Up Environment Variables

Create a `.env.local` file in the `blockwarriors-next` directory with the following variables:

```
# Google OAuth (Add these BEFORE launching Supabase)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret

# Supabase (Add these AFTER launching Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Supabase

Follow these steps to set up your local Supabase instance:

1. Install the Supabase CLI
2. Log in to Supabase: `npx supabase login`
3. Start Supabase: `npx supabase start`
4. Update your `.env` file with the Supabase URL and anonymous key

For detailed instructions on working with Supabase, see [Supabase Guide](./supabase.md).

### 4. Set Up Socket.io Server

Navigate to the Socket.io server directory:

```bash
cd ../blockwarriors-socket
```

Install dependencies:

```bash
npm install
# or
yarn
```

Create a `.env` file with the required environment variables.

### 5. Run the Applications

#### Next.js Application

```bash
cd blockwarriors-next
npm run dev
# or
yarn dev
```

#### Socket.io Server

```bash
cd blockwarriors-socket
npm run dev
# or
yarn dev
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

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.io Documentation](https://socket.io/docs)
- [Project Contributing Guide](./contributing.md)

## Need Help?

If you're stuck or have questions, reach out to the project maintainers or check the existing documentation in the repository.
