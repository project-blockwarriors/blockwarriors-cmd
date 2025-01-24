import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const app = express();
const server = createServer(app);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase key:", supabaseKey);
const supabase = createClient(supabaseUrl, supabaseKey);

const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with specific origins
    methods: ["GET", "POST"],
  },
});

// Store active game sessions
const gameSessions = new Map();

app.get("/", (req, res) => {
  res.send("<h1>BlockWarriors Socket.IO Server</h1>");
});

// Helper function to validate game token and get match ID
async function validateToken(token) {
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from("active_tokens")
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

// Handle socket connections
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);


  socket.on("login", async ({ playerId, token }, callback ) => {
    try {
      const validation = await validateToken(token);
      if (!validation.valid) {
        socket.emit("error", { message: validation.error });
        callback({ status: "bad" });
        return;
      }
      const matchId = validation.matchId;
      console.log(`Player ${playerId} joining match ${matchId}`);
      socket.join(matchId);
      console.log("socket joined room", matchId);
      if (!gameSessions.has(matchId)) {
        gameSessions.set(matchId, {
          players: new Set(),
          playerData: new Map(),
        });
        console.log("Set new game session with players: ", gameSessions.get(matchId).players);
        console.log("Set new game session with playerData: ", gameSessions.get(matchId).playerData);
      }
      const matchSession = gameSessions.get(matchId);
      matchSession.players.add(playerId);
      socket.to(matchId).emit("playerJoined", { playerId });
      callback({ status: "ok" });
      console.log("Callback ran: ", callback);
    } catch (error) {
      console.error("Error joining match:", error);
      socket.emit("error", { message: "Failed to join match" });
      callback({ status: "bad" });
    }
  });
  

  // Handle joining a game session
  socket.on("joinGame", async ({ playerId, token }) => {
    try {
      const validation = await validateToken(token);
      if (!validation.valid) {
        socket.emit("error", { message: validation.error });
        return;
      }

      const matchId = validation.matchId;
      console.log(`Player ${playerId} joining match ${matchId}`);

      // Join the match room
      socket.join(matchId);

      // Initialize match session if it doesn't exist
      if (!gameSessions.has(matchId)) {
        gameSessions.set(matchId, {
          players: new Set(),
          playerData: new Map(),
        });
      }

      const matchSession = gameSessions.get(matchId);
      matchSession.players.add(playerId);

      // Notify others in the match
      socket.to(matchId).emit("playerJoined", { playerId });
    } catch (error) {
      console.error("Error joining match:", error);
      socket.emit("error", { message: "Failed to join match" });
    }
  });

  // Handle real-time player data updates
  socket.on("updatePlayerData", async ({ playerId, data, token }) => {
    try {
      const validation = await validateToken(token);
      if (!validation.valid) {
        socket.emit("error", { message: validation.error });
        return;
      }

      const matchId = validation.matchId;
      if (!gameSessions.has(matchId)) {
        socket.emit("error", { message: "Match session not found" });
        return;
      }

      const matchSession = gameSessions.get(matchId);
      matchSession.playerData.set(playerId, data);

      // Broadcast the update to all players in the match except sender
      socket.to(matchId).emit("playerDataUpdate", { playerId, data });
    } catch (error) {
      console.error("Error updating player data:", error);
      socket.emit("error", { message: "Failed to update player data" });
    }
  });

  // Handle leaving a game session
  socket.on("leaveGame", async ({ playerId, token }) => {
    try {
      const validation = await validateToken(token);
      if (!validation.valid) {
        socket.emit("error", { message: validation.error });
        return;
      }

      const matchId = validation.matchId;
      if (gameSessions.has(matchId)) {
        const matchSession = gameSessions.get(matchId);
        matchSession.players.delete(playerId);
        matchSession.playerData.delete(playerId);

        // Remove match session if empty
        if (matchSession.players.size === 0) {
          gameSessions.delete(matchId);
        }

        socket.leave(matchId);
        io.to(matchId).emit("playerLeft", { playerId });
      }
    } catch (error) {
      console.error("Error leaving match:", error);
      socket.emit("error", { message: "Failed to leave match" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(
    `BlockWarriors Socket.IO server running at http://localhost:${PORT}`
  );
});
