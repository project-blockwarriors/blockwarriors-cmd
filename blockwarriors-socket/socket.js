import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";

// Initialize state
const state = {
  io: null,
  gameSessions: new Map(),
  // Key: match_id, Value: { players: Set, playerData: Map }
  // gameSessions.get(matchId).players is a set of player (minecraft uuids)
  
  socketToPlayer: new Map(),
  playerToSocket: new Map(),
  playerNamespace: null
};

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
async function validateToken(token) {
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from("active_tokens2")
      .select("match_id")
      .eq("token", token)
      .single();

    if (tokenError) {
      console.error("Token validation error:", tokenError);
      return { valid: false, error: "Invalid token" };
    }

    if (!tokenData) {
      return { valid: false, error: "Token not found" };
    }

    return { valid: true, matchId: tokenData.match_id };
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
        playerId: state.socketToPlayer.get(socket.id) 
      });
    }
  });
}

function handleDisconnect(socket) {
  console.log(`Client (player) disconnected: ${socket.id}`);
  state.playerToSocket.delete(state.socketToPlayer.get(socket.id));
  state.socketToPlayer.delete(socket.id);
}

async function handleLogin(socket, { playerId, token }, callback) {
  try {
    const validation = await validateToken(token);
    if (!validation.valid) {
      socket.emit("error", { message: validation.error });
      callback({ status: "bad" });
      return;
    }

    // On login, we need to store who logged in, (token)
    // along with what team they are on.
    // Do this using local variables and supabase
    // to get the team ID.

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

  return state.io;
}

// Get socket instance
function getIO() {
  if (!state.io) {
    throw new Error('Socket.io has not been initialized. Call initializeSocket first.');
  }
  return state.io;
}

function getSocketState() { 
  if (!state) { 
    throw new Error('Socket state has not been initialized. Call initializeSocket first.');
    return state;
  }
}

// Export functions and state getters
export {
  initializeSocket,
  getIO,
  getSocketState,
  state
};