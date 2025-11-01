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

        subgraph "Supabase"
            SupabaseEndpoint[Supabase Endpoint]
            PostgreSQL[(PostgreSQL)]
            Auth[Supabase Auth]
            Storage[Supabase Storage]
        end

        subgraph ExpressServer[Express Server]
            Express[Express.js]
            Socket[Socket.io Server]
        end

        MC["Minecraft Server<br/>(Paper/Spigot API)"]
    end

    %% Auth Providers
    subgraph Authentication
        Google[Google OAuth]
        Email[Email/Password]
    end

    %% Frontend Connections
    Next --- React
    React --- TW & RadixUI
    Next --- NextAPI & Express

    %% Backend Connections
    NextAPI --- SupabaseEndpoint
    SupabaseEndpoint --- PostgreSQL & Auth & Storage
    Express --- Socket
    Socket --- MC

    %% Auth Connections
    Auth --- Google & Email

    %% Styling
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px,color:black;
    classDef supabase fill:#f5f5f5,stroke:#333,stroke-width:2px,color:black;
    class Supabase supabase;
```

## Stack Components

### Frontend
- **Next.js v15**: React framework for server-rendered applications
- **React v18**: JavaScript library for building user interfaces
- **TailwindCSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible UI component library

### Backend
- **Next.js Server Actions/API Routes**: API endpoints and server-side functions
- **Supabase**: Open source Firebase alternative providing:
  - **PostgreSQL**: Relational database
  - **Auth**: Authentication and authorization
  - **Storage**: File storage
- **Express.js**: Web application framework for Node.js
- **Socket.io**: Real-time bidirectional event-based communication
- **Minecraft Server (Paper/Spigot API)**: Game server with plugin API

### Authentication
- **Google OAuth**: Third-party authentication provider
- **Email/Password**: Traditional authentication method
