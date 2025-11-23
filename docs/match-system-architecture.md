# Match System Architecture

This document describes how the match system components interact with each other.

## System Overview

```mermaid
graph TB
    subgraph "Frontend/UI"
        UI[Dashboard/Practice UI]
    end

    subgraph "Minecraft Server"
        BEACON[BlockWarriors-Beacon Plugin]
        LOGIN[LoginCommand]
        POLLING[MatchPollingService]
        TELEMETRY[MatchTelemetryService]
        PLAYER_EVENTS[PlayerEventListener]
    end

    subgraph "Convex Backend"
        HTTP[HTTP Routes]
        MATCHES[Matches Mutations/Queries]
        TOKENS[Tokens Mutations/Queries]
        DB[(Convex Database)]
    end

    UI -->|POST /matches/new| HTTP
    HTTP -->|createMatch| MATCHES
    MATCHES -->|Store| DB

    BEACON -->|Poll GET /matches?status=Queuing| HTTP
    HTTP -->|listMatchesByStatus| MATCHES
    MATCHES -->|Query| DB

    BEACON -->|Poll GET /matches/readiness| HTTP
    HTTP -->|checkMatchReadiness| TOKENS
    TOKENS -->|Query| DB

    BEACON -->|POST /matches/update| HTTP
    HTTP -->|updateMatch| MATCHES
    MATCHES -->|Update| DB

    BEACON -->|POST /matches/update match_state| HTTP
    HTTP -->|updateMatch| MATCHES
    MATCHES -->|Update| DB

    PLAYER_EVENTS -->|Player Quit| TELEMETRY

    LOGIN -->|POST /login| HTTP
    HTTP -->|validateToken| TOKENS
    TOKENS -->|Query| DB
    HTTP -->|markTokenAsUsed| TOKENS
    TOKENS -->|Update| DB

    POLLING -->|Start Match Directly| BEACON
    BEACON -->|Register Players| TELEMETRY
    TELEMETRY -->|Collect Data| BEACON
    TELEMETRY -->|POST /matches/update| HTTP
```

## Match Lifecycle Flow

```mermaid
sequenceDiagram
    participant UI as Dashboard UI
    participant HTTP as Convex HTTP Routes
    participant DB as Convex Database
    participant POLLING as MatchPollingService
    participant BEACON as Minecraft Server
    participant TELEMETRY as MatchTelemetryService
    participant PLAYER as Player

    Note over UI,DB: Match Creation Phase
    UI->>HTTP: POST /matches/new<br/>{match_type, mode, teams, match_state}
    HTTP->>DB: Create match with status "Queuing"
    DB-->>HTTP: Match created
    HTTP-->>UI: Return match_id and tokens

    Note over POLLING,DB: Match Polling Phase
    loop Every 2 seconds
        POLLING->>HTTP: GET /matches?status=Queuing
        HTTP->>DB: Query queued matches
        DB-->>HTTP: List of queued matches
        HTTP-->>POLLING: Matches list

        POLLING->>HTTP: GET /matches/readiness?match_id=X
        HTTP->>DB: Check if all tokens used
        DB-->>HTTP: Readiness status
        HTTP-->>POLLING: {ready: false, usedTokens: 2/4}
    end

    Note over PLAYER,HTTP: Player Login Phase
    PLAYER->>BEACON: /login <token>
    BEACON->>HTTP: POST /login<br/>{token, playerId, ign}
    HTTP->>DB: validateToken(token)
    DB-->>HTTP: Token valid, match_id
    HTTP->>DB: markTokenAsUsed(token, playerId, ign)
    DB-->>HTTP: Token marked
    HTTP-->>BEACON: {status: "ok", matchId}
    BEACON-->>PLAYER: Logged in

    Note over POLLING,DB: Match Ready Detection
    POLLING->>HTTP: GET /matches/readiness?match_id=X
    HTTP->>DB: Check if all tokens used
    DB-->>HTTP: {ready: true, usedTokens: 4/4}
    HTTP-->>POLLING: Match ready!

    Note over POLLING,TELEMETRY: Match Start Phase
    POLLING->>HTTP: POST /matches/update<br/>{matchId, match_status: "Waiting"}
    HTTP->>DB: Update match status
    POLLING->>HTTP: POST /matches/update<br/>{matchId, match_status: "Playing"}
    HTTP->>DB: Update match status

    POLLING->>BEACON: Start match directly<br/>{matchId, teams, matchType}
    BEACON->>BEACON: Create match world
    BEACON->>TELEMETRY: Register players in match
    TELEMETRY->>TELEMETRY: Start tracking players

    Note over TELEMETRY,DB: Telemetry Collection Phase
    loop Every 1 second
        TELEMETRY->>BEACON: Collect player stats<br/>(health, position, equipment, etc.)
        BEACON-->>TELEMETRY: Player telemetry data
        TELEMETRY->>HTTP: POST /matches/update<br/>{matchId, match_state: {...}}
        HTTP->>DB: Update match_state JSON blob
    end

    Note over PLAYER,TELEMETRY: Player Quit
    PLAYER->>BEACON: Player quits
    BEACON->>TELEMETRY: Unregister player
    TELEMETRY->>TELEMETRY: Stop tracking player
```

## Component Details

### MatchPollingService

- **Purpose**: Polls Convex for queued matches and starts them when ready
- **Frequency**: Every 2 seconds
- **Key Operations**:
  - Fetch queued matches
  - Check match readiness (all tokens used)
  - Update match status (Waiting → Playing)
  - Start match directly when ready

### MatchTelemetryService

- **Purpose**: Collects and stores player telemetry data during matches
- **Frequency**: Every 1 second
- **Key Operations**:
  - Track players in active matches
  - Collect player stats (health, position, equipment, kills/deaths)
  - Update match_state via HTTP routes
  - Unregister players when they quit

### LoginCommand

- **Purpose**: Handles player login via HTTP routes
- **Key Operations**:
  - Sends login request to Convex HTTP route
  - Validates token and marks it as used
  - Tracks logged-in players locally

### Convex HTTP Routes

- **POST /matches/new**: Create new match with "Queuing" status
- **GET /matches**: List matches (optionally filtered by status)
- **GET /matches?id={id}**: Get single match by ID
- **GET /matches/readiness?match_id={id}**: Check if match is ready (all tokens used)
- **GET /matches/tokens?match_id={id}**: Get all tokens for a match
- **POST /matches/update**: Update match status and/or match_state
- **POST /login**: Validate token and mark as used

### Convex Mutations/Queries

- **matches.createMatch**: Create a new match
- **matches.updateMatch**: Update match status and/or state
- **matches.getMatchById**: Get match by ID
- **matches.listMatchesByStatus**: List matches by status
- **tokens.validateToken**: Validate a token
- **tokens.markTokenAsUsed**: Mark token as used with player info
- **tokens.checkMatchReadiness**: Check if all tokens for a match are used
- **tokens.getTokensByMatchId**: Get all tokens for a match

## Data Flow

### Match State Structure

```json
{
  "timestamp": 1234567890,
  "matchId": "j123...",
  "players": [
    {
      "playerId": "uuid",
      "ign": "PlayerName",
      "health": 20.0,
      "maxHealth": 20.0,
      "foodLevel": 20,
      "position": {
        "x": 0.0,
        "y": 64.0,
        "z": 0.0,
        "world": "world1"
      },
      "equipment": {
        "mainHand": "Diamond Sword",
        "helmet": "Diamond Helmet",
        "chestplate": "Diamond Chestplate",
        "leggings": "Diamond Leggings",
        "boots": "Diamond Boots"
      },
      "kills": 5,
      "deaths": 2,
      "nearbyPlayers": 3
    }
  ]
}
```

### Match Status Transitions

```
Queuing → Waiting → Playing → Finished/Terminated
```

- **Queuing**: Match created, waiting for all players to log in
- **Waiting**: All players logged in, match starting
- **Playing**: Match in progress, telemetry being collected
- **Finished**: Match completed normally
- **Terminated**: Match ended abnormally

## Key Interactions

1. **Match Creation**: UI creates match → Convex stores it with "Queuing" status
2. **Player Login**: Player logs in → HTTP route validates token → Token marked as used in Convex
3. **Match Detection**: Polling service checks readiness → When all tokens used, match starts directly
4. **Telemetry Collection**: Service collects player stats → Updates match_state in Convex
5. **Match State Rendering**: Website can query match_state → Render player telemetry data
