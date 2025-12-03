# BlockWarriors Mineflayer Testing Client

A standalone web-based testing client for controlling Mineflayer bots to test the BlockWarriors Minecraft server.

## Features

- **Multi-Bot Management**: Create and manage multiple bot instances simultaneously
- **Token Authentication**: Login bots using BlockWarriors authentication tokens
- **Real-time GUI**: Web interface with live updates via WebSocket
- **Bot Control Commands**:
  - Chat messages
  - Attack/kill players
  - Follow players
  - Move to coordinates
  - Disconnect/reconnect
- **Observability**: Real-time logs, position tracking, health monitoring, and player list

## Prerequisites

- Node.js >= 20.9.0
- Access to BlockWarriors matches with authentication tokens

## Installation

1. Navigate to the app directory:
```bash
cd apps/mineflayer-tester
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Starting the Client

Run the development server:
```bash
npm run dev
```

The web interface will be available at: [http://localhost:3000](http://localhost:3000)

### Creating and Connecting Bots

1. **Get Authentication Tokens**:
   - Go to the BlockWarriors dashboard
   - Create a match (Practice or Ranked)
   - Wait for match status to change to "Waiting"
   - Copy the authentication tokens from the match page

2. **Create a Bot**:
   - Click "Add Bot" in the web interface
   - Enter a username for the bot
   - Click "Create"

3. **Connect the Bot**:
   - Click "Connect" on the bot card
   - Paste the authentication token
   - The bot will connect to `play.blockwarriors.ai` and automatically run `/login <token>`

4. **Control the Bot**:
   - **Chat**: Send messages in the Minecraft chat
   - **Attack**: Target a player by username to attack them
   - **Follow**: Follow a player by username
   - **Move**: Move to specific X, Y, Z coordinates

### Bot Testing Workflow

Here's a typical testing workflow:

1. **Create a Match**:
   - Go to BlockWarriors dashboard
   - Create a PvP practice match
   - Wait for tokens to be generated (status: "Waiting")

2. **Connect Bots**:
   - Create 2 bots in the testing client (e.g., "TestBot1", "TestBot2")
   - Connect each bot with a different token from the match

3. **Test Combat**:
   - Use the "Attack" command to make one bot attack the other
   - Watch the logs for combat events
   - Monitor health and position in real-time

4. **Test Movement**:
   - Use "Follow" to make a bot follow another player
   - Use "Move" to send bots to specific coordinates
   - Observe pathfinding behavior

5. **Test Communication**:
   - Send chat messages from bots
   - Verify messages appear in-game

## Architecture

```
apps/mineflayer-tester/
├── src/
│   ├── index.js           # Entry point
│   ├── server.js          # Express + Socket.io server
│   ├── bot-manager.js     # Manages multiple bot instances
│   ├── bot-instance.js    # Individual Mineflayer bot wrapper
│   └── public/
│       ├── index.html     # Web GUI
│       ├── styles.css     # Styling
│       └── app.js         # Frontend JavaScript
└── package.json
```

### Technology Stack

- **Backend**: Node.js, Express, Socket.io
- **Bot Client**: Mineflayer (Minecraft bot framework)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Real-time Communication**: WebSocket (Socket.io)

## How It Works

### Authentication Flow

1. Bot connects to `play.blockwarriors.ai` in offline mode
2. Once logged in, bot automatically sends `/login <token>` command
3. BlockWarriors Minecraft plugin validates token via Convex backend
4. If valid, bot is added to the match and can participate

### Bot Control

- Each bot runs as a Mineflayer instance in Node.js
- BotManager coordinates multiple bot instances
- WebSocket provides real-time communication between server and GUI
- Bot events (chat, health, position, etc.) are forwarded to the web interface

### Real-time Updates

- **Logs**: All bot activity (chat, errors, status changes)
- **Status**: Connection state, health, food level
- **Position**: X, Y, Z coordinates (throttled to 500ms)
- **Player List**: Other players visible to the bot

## API Reference

### REST Endpoints

- `GET /api/bots` - Get all bot states
- `POST /api/bots/create` - Create a new bot
- `POST /api/bots/:id/connect` - Connect bot with token
- `POST /api/bots/:id/disconnect` - Disconnect bot
- `DELETE /api/bots/:id` - Remove bot
- `POST /api/bots/:id/chat` - Send chat message
- `POST /api/bots/:id/kill` - Attack a player
- `POST /api/bots/:id/stop-attack` - Stop attacking
- `POST /api/bots/:id/follow` - Follow a player
- `POST /api/bots/:id/move` - Move to coordinates

### WebSocket Events

**Client → Server**: (Handled via REST API)

**Server → Client**:
- `bots-update` - Full bot state update
- `log` - Log message from a bot
- `error` - Error from a bot
- `status` - Status update (health, connection, etc.)
- `position` - Position update

## Troubleshooting

### Bot Won't Connect

- Verify the token is valid and not expired (15-minute expiration)
- Check that the match is in "Waiting" status
- Ensure `play.blockwarriors.ai` is accessible

### Authentication Failed

- Make sure you're using a fresh token from an active match
- Tokens can only be used once
- Check the logs for specific error messages from the server

### Bot Disconnects

- Minecraft server may kick idle bots
- Check server logs for kick reasons
- Verify network connectivity

## Development

### Adding New Commands

1. Add method to `BotInstance` class in [bot-instance.js](src/bot-instance.js)
2. Add API endpoint in [server.js](src/server.js)
3. Add UI button and handler in [app.js](src/public/app.js)

### Customization

- **Port**: Set `PORT` environment variable (default: 3000)
- **Server**: Modify host in [bot-instance.js:35](src/bot-instance.js#L35)
- **Styling**: Edit [styles.css](src/public/styles.css)

## Limitations

- Bots use offline mode authentication (token-based via `/login` command)
- No pathfinding plugin by default (basic movement only)
- Combat is basic melee attacks (no advanced PvP logic)
- GUI is client-side only (no user authentication)

## Future Enhancements

- Add mineflayer-pathfinder for advanced navigation
- Implement PvP combat strategies
- Add match creation from the testing client
- Support for uploading custom bot scripts
- Replay system for recorded matches

## License

Part of the BlockWarriors monorepo.
