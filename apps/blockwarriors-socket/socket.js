import { Server } from "socket.io";
import { queryWithAuth, mutateWithAuth, api } from "./convexClient.js";

// Initialize state
const state = {
  io: null,
  serverSockets: [],
  gameSessions: new Map(),
  // Key: match_id, Value: { players: Set, playerData: Map }
  // gameSessions.get(matchId).players is a set of player (minecraft uuids)

  socketToPlayer: new Map(),
  playerToSocket: new Map(),
  playerNamespace: null,
};

// Helper functions
async function validateToken(token) {
  try {
    // Note: For socket connections, we don't have an auth token from the user
    // We're validating the game token itself, so we pass null for auth token
    // The tokens.validateToken query doesn't require authentication
    const validation = await queryWithAuth(
      api.tokens.validateToken,
      { token },
      null
    );

    if (!validation || !validation.valid) {
      return {
        valid: false,
        error: validation?.error || "Token validation failed",
      };
    }

    // Convert Convex ID to string for compatibility
    const matchIdString = validation.matchId.toString();

    return {
      valid: true,
      matchId: matchIdString,
      gameTeamId: validation.gameTeamId?.toString(),
    };
  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false, error: "Token validation failed" };
  }
}

// Event handlers
function handleDisconnecting(socket) {
  socket.rooms.forEach((room) => {
    if (typeof room === "number") {
      socket.to(room).emit("playerLeft", {
        playerId: state.socketToPlayer.get(socket.id),
      });
    }
  });
}

function handleDisconnect(socket) {
  console.log(`Client (player) disconnected: ${socket.id}`);
  state.playerToSocket.delete(state.socketToPlayer.get(socket.id));
  state.socketToPlayer.delete(socket.id);
}

async function handleLogin(socket, { playerId, token, ign }, callback) {
  try {
    const validation = await validateToken(token);
    if (!validation.valid) {
      socket.emit("error", { message: validation.error });
      callback({ status: "bad" });
      return;
    }

    // Mark token as used by this player (Minecraft UUID and IGN)
    // This allows the Minecraft server to track which tokens have been used
    try {
      await mutateWithAuth(
        api.tokens.markTokenAsUsed,
        {
          token: token,
          playerId: playerId,
          ign: ign, // In-Game Name (Minecraft username)
        },
        null // No auth token needed for token operations
      );
    } catch (error) {
      console.error("Failed to mark token as used:", error);
      // Continue even if marking fails - token might already be marked
    }

    // On login, we need to store who logged in, (token)
    // along with what team they are on.
    // Team ID is available from the token validation result.

    state.socketToPlayer.set(socket.id, playerId);
    state.playerToSocket.set(playerId, socket.id);
    const matchId = validation.matchId;

    socket.join(matchId);
    if (!state.gameSessions.has(matchId)) {
      state.gameSessions.set(matchId, {
        players: new Set(),
        playerData: new Map(),
      });
    }

    const matchSession = state.gameSessions.get(matchId);
    matchSession.players.add(playerId);
    socket.to(matchId).emit("playerJoined", { playerId });
    callback({ status: "ok" });
  } catch (error) {
    console.error("Error joining match:", error);
    socket.emit("error", { message: "Failed to join match" });
    callback({ status: "bad" });
  }
}

function setupPlayerNamespace() {
  state.playerNamespace = state.io.of("/player");
  state.playerNamespace.on("connection", (socket) => {
    console.log(`Client connected to player namespace: ${socket.id}`);

    socket.on("disconnecting", () => handleDisconnecting(socket));
    socket.on("disconnect", () => handleDisconnect(socket));
    socket.on("login", (data, callback) => handleLogin(socket, data, callback));
    // Add other event handlers here
  });
}

function setupMainNamespace() {
  state.io.on("connection", (socket) => {
    console.log(`Client connected to main namespace: ${socket.id}`);
    // save as a server socket
    state.io.emit("hello", "Hello from the server!");
    state.serverSockets.push(socket.id);

    socket.on("disconnect", () => {
      console.log(`Client (main) disconnected: ${socket.id}`);
    });
  });
}

// Initialize socket.io
function initializeSocket(server) {
  if (state.io) return state.io;

  state.io = new Server(server, {
    cors: {
      origin: "*", // In production, replace with specific origins
      methods: ["GET", "POST"],
    },
  });

  setupPlayerNamespace();
  setupMainNamespace();

  state.io.emit("hello", "Hello from the server!");
  return state.io;
}

// Get socket instance
function getIO() {
  if (!state.io) {
    throw new Error(
      "Socket.io has not been initialized. Call initializeSocket first."
    );
  }
  return state.io;
}

function getSocketState() {
  if (!state) {
    throw new Error(
      "Socket state has not been initialized. Call initializeSocket first."
    );
  }
  return state;
}

// Export functions and state getters
export { initializeSocket, getIO, getSocketState, state };
