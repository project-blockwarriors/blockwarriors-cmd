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
    BEACON -->|Poll GET /matches?status=Waiting| HTTP
    BEACON -->|Poll GET /matches?status=Playing| HTTP
    HTTP -->|listMatchesByStatus| MATCHES
    MATCHES -->|Query| DB

    BEACON -->|POST /matches/acknowledge| HTTP
    HTTP -->|acknowledgeMatchAndGenerateTokens| MATCHES
    MATCHES -->|Generate Tokens| TOKENS
    MATCHES -->|Update Status to Waiting| DB
    TOKENS -->|Store| DB

    BEACON -->|Poll GET /matches/readiness| HTTP
    HTTP -->|checkMatchReadiness| TOKENS
    TOKENS -->|Query| DB

    UI -->|POST /matches/update<br/>Begin Game| HTTP
    BEACON -->|POST /matches/update| HTTP
    HTTP -->|updateMatch| MATCHES
    MATCHES -->|Update| DB

    BEACON -->|POST /matches/update match_state| HTTP
    HTTP -->|updateMatch| MATCHES
    MATCHES -->|Update| DB

    PLAYER_EVENTS -->|Player Quit| TELEMETRY

    LOGIN -->|POST /validateToken| HTTP
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
    UI->>HTTP: POST /matches/new<br/>{match_type, mode}
    HTTP->>DB: Create match with status "Queuing"<br/>(no tokens yet)
    DB-->>HTTP: Match created
    HTTP-->>UI: Return match_id<br/>(tokens will be generated later)

    Note over POLLING,DB: Match Acknowledgment Phase
    loop Every 5 seconds
        POLLING->>HTTP: GET /matches?status=Queuing
        HTTP->>DB: Query queued matches
        DB-->>HTTP: List of queued matches
        HTTP-->>POLLING: Matches list

        alt Match found in Queuing status
            POLLING->>HTTP: POST /matches/acknowledge<br/>{match_id, tokens_per_team}
            HTTP->>DB: Generate tokens for match
            HTTP->>DB: Update status to "Waiting"
            DB-->>HTTP: Tokens generated
            HTTP-->>POLLING: Acknowledgment success
        end
    end

    Note over PLAYER,HTTP: Player Login Phase
    PLAYER->>BEACON: /login <token>
    BEACON->>HTTP: POST /validateToken<br/>{token, playerId, ign}
    HTTP->>DB: validateToken(token)
    DB-->>HTTP: Token valid, match_id
    HTTP->>DB: markTokenAsUsed(token, playerId, ign)
    DB-->>HTTP: Token marked
    HTTP-->>BEACON: {status: "ok", matchId}
    BEACON-->>PLAYER: Logged in

    Note over POLLING,DB: Match Ready Detection
    loop Every 5 seconds
        POLLING->>HTTP: GET /matches?status=Waiting
        HTTP->>DB: Query waiting matches
        DB-->>POLLING: Waiting matches

        POLLING->>HTTP: GET /matches/readiness?match_id=X
        HTTP->>DB: Check if all tokens used
        DB-->>HTTP: {ready: true, usedTokens: 2/2}
        HTTP-->>POLLING: Match ready!
    end

    Note over UI,POLLING: Match Start Phase (Two Paths)
    alt Website clicks "Begin Game"
        UI->>HTTP: POST /matches/update<br/>{match_id, match_status: "Playing"}
        HTTP->>DB: Update match status to "Playing"
        DB-->>HTTP: Status updated
        HTTP-->>UI: Success

        POLLING->>HTTP: GET /matches?status=Playing
        HTTP->>DB: Query playing matches
        DB-->>POLLING: Match found (not started yet)
    else MC Plugin auto-starts
        POLLING->>HTTP: POST /matches/update<br/>{matchId, match_status: "Playing"}
        HTTP->>DB: Update match status
    end

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

- **Purpose**: Polls Convex for matches and manages the match lifecycle
- **Frequency**: Every 5 seconds
- **Key Operations**:
  - Fetch "Queuing" matches → Acknowledge them (generate tokens, set status to "Waiting")
  - Fetch "Waiting" matches → Check readiness (all tokens used)
  - Fetch "Playing" matches → Start match if not already started (handles website-initiated starts)
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

- **POST /matches/new**: Create new match with "Queuing" status (no tokens generated yet)
- **POST /matches/acknowledge**: Acknowledge a queued match - atomically generates tokens and updates status to "Waiting"
- **GET /matches**: List matches (optionally filtered by status: `?status=Queuing|Waiting|Playing`)
- **GET /matches?id={id}**: Get single match by ID
- **GET /matches/readiness?match_id={id}**: Check if match is ready (all tokens used)
- **GET /matches/tokens?match_id={id}**: Get all tokens for a match
- **POST /matches/update**: Update match status and/or match_state
- **POST /validateToken**: Validate token and mark as used (replaces `/login`)

### Convex Mutations/Queries

- **matches.createMatch**: Create a new match (without tokens)
- **matches.acknowledgeMatchAndGenerateTokens**: Atomically acknowledge match, generate tokens, and update status to "Waiting"
- **matches.updateMatch**: Update match status and/or state
- **matches.getMatchById**: Get match by ID
- **matches.getMatchWithTokens**: Get match with tokens and player IGNs (for UI)
- **matches.listMatchesByStatus**: List matches by status
- **matches.archiveOldQueuedMatches**: Archive matches stuck in "Queuing" for >10 minutes
- **tokens.validateToken**: Validate a token
- **tokens.markTokenAsUsed**: Mark token as used with player info (includes IGN)
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

- **Queuing**: Match created by website, waiting for MC server acknowledgment (no tokens generated yet)
- **Waiting**: MC server acknowledged match, tokens generated, waiting for all players to log in
- **Playing**: All players logged in, match in progress, telemetry being collected
- **Finished**: Match completed normally (winner determined, world deleted)
- **Terminated**: Match ended abnormally or archived (stuck in Queuing >10 minutes)

### Token Generation Flow

Tokens are **only generated after** the Minecraft server acknowledges a queued match:

1. Website creates match → Status: "Queuing" (no tokens)
2. MC plugin polls → Finds "Queuing" match → Calls `/matches/acknowledge`
3. `/matches/acknowledge` → Atomically generates tokens AND updates status to "Waiting"
4. Players can now log in with tokens
5. When all tokens used → Match can start (either auto-start or manual "Begin Game" button)

## Key Interactions

1. **Match Creation**: UI creates match → Convex stores it with "Queuing" status (no tokens yet)
2. **Match Acknowledgment**: MC plugin polls → Finds "Queuing" match → Calls `/matches/acknowledge` → Tokens generated, status becomes "Waiting"
3. **Player Login**: Player logs in → HTTP route `/validateToken` validates token → Token marked as used in Convex (with IGN stored)
4. **Match Ready Detection**: Polling service checks "Waiting" matches → When all tokens used, match can start
5. **Match Start**: Either MC plugin auto-starts OR website clicks "Begin Game" → Status becomes "Playing" → MC plugin starts match
6. **Telemetry Collection**: Service collects player stats → Updates match_state in Convex (stops when match finished)
7. **Match State Rendering**: Website queries match_state via `getMatchWithTokens` → Renders player telemetry data and IGNs in real-time
8. **Stale Match Cleanup**: Cron job archives matches stuck in "Queuing" for >10 minutes to prevent performance issues
