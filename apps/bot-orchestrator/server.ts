import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { botManager } from "./src/server/BotManager.js";
import { v4 as uuidv4 } from "uuid";
import type { BotCommand, CreateBotRequest, BotState } from "./src/types/bot.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socketio",
  });

  // Set up bot manager callbacks
  botManager.setCallbacks(
    // On bot update
    (botId: string, state: BotState) => {
      io.emit("bot_update", { botId, state });
    },
    // On bot chat
    (botId: string, username: string, message: string) => {
      io.emit("chat_message", {
        botId,
        username,
        message,
        timestamp: Date.now(),
      });
    },
    // On bot error
    (botId: string, error: string) => {
      io.emit("bot_error", { botId, error });
    }
  );

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send current bot list on connection
    socket.emit("bots_list", botManager.getAllBots());

    // Create new bot
    socket.on("create_bot", async (data: CreateBotRequest) => {
      try {
        const id = uuidv4();
        const state = await botManager.createBot(id, data.ign, data.token);
        socket.emit("bot_created", { id, state });
        io.emit("bots_list", botManager.getAllBots());
      } catch (error) {
        socket.emit("error", {
          message: error instanceof Error ? error.message : "Failed to create bot",
        });
      }
    });

    // Execute bot command
    socket.on(
      "bot_command",
      async (data: { botId: string; command: BotCommand }) => {
        try {
          await botManager.executeCommand(data.botId, data.command);
        } catch (error) {
          socket.emit("error", {
            message:
              error instanceof Error ? error.message : "Failed to execute command",
          });
        }
      }
    );

    // Remove bot
    socket.on("remove_bot", (botId: string) => {
      const removed = botManager.removeBot(botId);
      if (removed) {
        io.emit("bot_removed", { botId });
        io.emit("bots_list", botManager.getAllBots());
      }
    });

    // Get all bots
    socket.on("get_bots", () => {
      socket.emit("bots_list", botManager.getAllBots());
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Bot Orchestrator ready on http://${hostname}:${port}`);
  });
});
