import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { botManager } from './src/server/BotManager.js';
import { startConvexListener } from './src/listener.js';
import { v4 as uuidv4 } from 'uuid';
import type {
  BotCommand,
  CreateBotRequest,
  BotState,
} from './src/types/bot.js';

// Enable debug logging if needed - set DEBUG env var to enable
// DEBUG=minecraft-protocol npm run dev
if (process.env.DEBUG) {
  console.log(`Debug mode enabled: ${process.env.DEBUG}`);
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const portFromEnv = parseInt(process.env.PORT || '3001', 10);
const minecraftPortFromEnv = parseInt(
  process.env.MINECRAFT_PORT || '25565',
  10
);
const port = Number.isNaN(portFromEnv) ? 3001 : portFromEnv;

let minecraftServerConfig = {
  host: process.env.MINECRAFT_HOST || 'mcpanel.blockwarriors.ai',
  port: Number.isNaN(minecraftPortFromEnv) ? 25565 : minecraftPortFromEnv,
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      path: '/api/socketio',
    });

    botManager.setCallbacks(
      (botId: string, state: BotState) => {
        io.emit('bot_update', { botId, state });
      },
      (botId: string, username: string, message: string) => {
        io.emit('chat_message', {
          botId,
          username,
          message,
          timestamp: Date.now(),
        });
      },
      (botId: string, error: string) => {
        io.emit('bot_error', { botId, error });
      }
    );

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.emit('bots_list', botManager.getAllBots());
      socket.emit('server_config', minecraftServerConfig);

      socket.on('create_bot', async (data: CreateBotRequest) => {
        try {
          const id = uuidv4();
          const state = await botManager.createBot(
            id,
            data.ign,
            data.token,
            minecraftServerConfig.host,
            minecraftServerConfig.port
          );
          socket.emit('bot_created', { id, state });
          io.emit('bots_list', botManager.getAllBots());
        } catch (error) {
          socket.emit('error', {
            message:
              error instanceof Error ? error.message : 'Failed to create bot',
          });
        }
      });

      socket.on(
        'bot_command',
        async (data: { botId: string; command: BotCommand }) => {
          try {
            await botManager.executeCommand(data.botId, data.command);
          } catch (error) {
            socket.emit('error', {
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to execute command',
            });
          }
        }
      );

      socket.on('remove_bot', (botId: string) => {
        const removed = botManager.removeBot(botId);
        if (removed) {
          io.emit('bot_removed', { botId });
          io.emit('bots_list', botManager.getAllBots());
        }
      });

      socket.on('get_bots', () => {
        socket.emit('bots_list', botManager.getAllBots());
      });

      socket.on('get_server_config', () => {
        socket.emit('server_config', minecraftServerConfig);
      });

      socket.on(
        'update_server_config',
        (data: { host: string; port: number }) => {
          minecraftServerConfig = {
            host: data.host,
            port: data.port,
          };
          io.emit('server_config', minecraftServerConfig);
          console.log('Server configuration updated:', minecraftServerConfig);
        }
      );

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    httpServer.listen(port, () => {
      console.log(`> Bot Orchestrator ready on http://${hostname}:${port}`);
      startConvexListener();
    });
  })
  .catch((error) => {
    console.error('Failed to prepare Next.js app:', error);
    process.exit(1);
  });

