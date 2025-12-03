import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { BotManager } from './bot-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createAppServer(port = 3000) {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const botManager = new BotManager();

  // Serve static files
  app.use(express.static(join(__dirname, 'public')));
  app.use(express.json());

  // API Routes
  app.get('/api/bots', (req, res) => {
    try {
      const states = botManager.getAllStates();
      res.json({ success: true, bots: states });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/create', (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }

      const id = botManager.createBot(username);
      res.json({ success: true, botId: id });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/connect', async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }

      await botManager.connectBot(parseInt(id), token);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/disconnect', (req, res) => {
    try {
      const { id } = req.params;
      botManager.disconnectBot(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/bots/:id', (req, res) => {
    try {
      const { id } = req.params;
      botManager.removeBot(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/chat', (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      botManager.chatAsBot(parseInt(id), message);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/kill', (req, res) => {
    try {
      const { id } = req.params;
      const { target } = req.body;

      if (!target) {
        return res.status(400).json({ success: false, error: 'Target username is required' });
      }

      botManager.killPlayer(parseInt(id), target);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/stop-attack', (req, res) => {
    try {
      const { id } = req.params;
      botManager.stopAttack(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/follow', (req, res) => {
    try {
      const { id } = req.params;
      const { target } = req.body;

      botManager.followPlayer(parseInt(id), target);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/move', (req, res) => {
    try {
      const { id } = req.params;
      const { x, y, z } = req.body;

      if (x === undefined || y === undefined || z === undefined) {
        return res.status(400).json({ success: false, error: 'x, y, z coordinates are required' });
      }

      botManager.moveTo(parseInt(id), parseFloat(x), parseFloat(y), parseFloat(z));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/move-relative', (req, res) => {
    try {
      const { id } = req.params;
      const { dx, dz } = req.body;

      if (dx === undefined || dz === undefined) {
        return res.status(400).json({ success: false, error: 'dx, dz are required' });
      }

      botManager.moveRelative(parseInt(id), parseFloat(dx), parseFloat(dz));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/bots/:id/stop-follow', (req, res) => {
    try {
      const { id } = req.params;
      botManager.stopFollow(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial state
    socket.emit('bots-update', botManager.getAllStates());

    // Forward all bot manager events to connected clients
    const logHandler = (data) => socket.emit('log', data);
    const errorHandler = (data) => socket.emit('error', data);
    const statusHandler = (data) => {
      socket.emit('status', data);
      socket.emit('bots-update', botManager.getAllStates());
    };
    const positionHandler = (data) => socket.emit('position', data);
    const botCreatedHandler = () => socket.emit('bots-update', botManager.getAllStates());
    const botRemovedHandler = () => socket.emit('bots-update', botManager.getAllStates());

    botManager.on('log', logHandler);
    botManager.on('error', errorHandler);
    botManager.on('status', statusHandler);
    botManager.on('position', positionHandler);
    botManager.on('bot-created', botCreatedHandler);
    botManager.on('bot-removed', botRemovedHandler);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      botManager.off('log', logHandler);
      botManager.off('error', errorHandler);
      botManager.off('status', statusHandler);
      botManager.off('position', positionHandler);
      botManager.off('bot-created', botCreatedHandler);
      botManager.off('bot-removed', botRemovedHandler);
    });
  });

  // Start server
  httpServer.listen(port, () => {
    console.log(`Mineflayer Testing Client running on http://localhost:${port}`);
    console.log(`Connect to BlockWarriors at: play.blockwarriors.ai`);
  });

  return { app, httpServer, io, botManager };
}
