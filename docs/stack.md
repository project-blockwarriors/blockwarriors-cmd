# BlockWarriors Technology Stack

This document provides a visual representation and explanation of the technology stack used in the BlockWarriors project.

## Architecture Diagram

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend
        Next[Next.js v15]
        React[React v18]
        TW[TailwindCSS]
        RadixUI[Radix UI Components]
    end

    %% Backend Layer
    subgraph Backend
        NextAPI[Next.js Server Actions/API Routes]
        Convex[Convex (Queries/Mutations/Actions)]

        subgraph ExpressServer["Express Server"]
            Express[Express.js]
            Socket[Socket.io Server]
        end

        MC["Minecraft Server<br/>(Paper/Spigot API)"]
    end

    %% Auth Providers
    subgraph Authentication
        BetterAuth[Better Auth]
        Google[Google OAuth]
    end

    %% Frontend Connections
    Next --- React
    React --- TW & RadixUI
    Next --- NextAPI & Express & Convex

    %% Backend Connections
    NextAPI --- Convex
    Express --- Socket
    Express --- Convex
    Socket --- MC

    %% Auth Connections
    BetterAuth --- Google
    Convex --- BetterAuth

    %% Styling
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px,color:black;
```

## Stack Components

### Frontend
- **Next.js v15**: React framework for server-rendered applications
- **React v18**: JavaScript library for building user interfaces
- **TailwindCSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI component library

### Backend
- **Next.js Server Actions/API Routes**: API endpoints and server-side functions
- **Convex**: Hosted backend for type-safe queries, mutations, and actions; used for data access and auth integration
- **Express.js**: Web application framework for Node.js
- **Socket.io**: Real-time bidirectional event-based communication
- **Minecraft Server (Paper/Spigot API)**: Game server with plugin API

### Monorepo Structure (apps/ and packages/)

- `apps/blockwarriors-next`
  - Next.js web dashboard (frontend UI)
  - Uses the Convex React client and Better Auth client
  - Reads client-side envs:
    - `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_DEPLOYMENT`
    - `NEXT_PUBLIC_CONVEX_SITE_URL`, `NEXT_PUBLIC_SITE_URL`

- `apps/blockwarriors-socket`
  - Express + Socket.io server (real-time updates)
  - Contacts Convex using the server Convex client
  - Reads server envs:
    - `CONVEX_URL`, `CONVEX_DEPLOYMENT`

- `packages/backend`
  - Shared Convex backend used by all apps
  - Convex functions live in `packages/backend/convex/*.ts` (queries, mutations, actions)
  - Auth is configured in `packages/backend/convex/auth.ts` (Better Auth + Google OAuth)
  - Generated API/types in `packages/backend/_generated/*` (via `npx convex dev` or `npm run convex:codegen`)
  - Reads Convex environment variables:
    - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SITE_URL`

At a glance:
- Frontend (Next.js) and Socket server both call Convex.
- Convex hosts data logic and auth; both apps share the same generated API from `packages/backend`.
