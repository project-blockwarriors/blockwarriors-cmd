import mineflayer from 'mineflayer';
import pathfinderPlugin from 'mineflayer-pathfinder';
import pvpPlugin from 'mineflayer-pvp';
import { EventEmitter } from 'events';

const { pathfinder, Movements, goals } = pathfinderPlugin;
const { plugin: pvp } = pvpPlugin;

// Try to import prismarine-viewer, but make it optional
let mineflayerViewer = null;
try {
  const prismarineViewer = await import('prismarine-viewer');
  mineflayerViewer = prismarineViewer.mineflayer;
} catch (e) {
  console.log('prismarine-viewer not available (requires canvas). 3D viewer will be disabled.');
}

/**
 * Represents a single Mineflayer bot instance
 */
export class BotInstance extends EventEmitter {
  constructor(id, username, viewerPort) {
    super();
    this.id = id;
    this.username = username;
    this.viewerPort = viewerPort;
    this.bot = null;
    this.viewer = null;
    this.status = 'disconnected'; // disconnected, connecting, connected, error
    this.token = null;
    this.matchId = null;
    this.teamId = null;
    this.attacking = false;
    this.following = false;
  }

  /**
   * Connect the bot to the Minecraft server with a token
   */
  async connect(token) {
    this.token = token;
    this.status = 'connecting';
    this.emit('status', { id: this.id, status: 'connecting', message: 'Connecting to server...' });

    try {
      // Connect to BlockWarriors server
      this.bot = mineflayer.createBot({
        host: 'mcpanel.blockwarriors.ai',
        port: 25565,
        username: this.username,
        auth: 'offline', // Offline mode - authentication via token
        version: false, // Auto-detect version
      });

      // Load plugins
      this.bot.loadPlugin(pathfinder);
      this.bot.loadPlugin(pvp);

      this.setupEventHandlers();
    } catch (error) {
      this.status = 'error';
      this.emit('error', { id: this.id, error: error.message });
    }
  }

  /**
   * Set up event handlers for the bot
   */
  setupEventHandlers() {
    this.bot.on('login', () => {
      this.status = 'connected';
      this.emit('log', { id: this.id, level: 'info', message: `Bot logged in as ${this.bot.username}` });

      // Send login command with token
      setTimeout(() => {
        this.bot.chat(`/login ${this.token}`);
        this.emit('log', { id: this.id, level: 'info', message: `Sent login command with token` });
      }, 1000);
    });

    this.bot.on('spawn', () => {
      this.emit('log', { id: this.id, level: 'success', message: 'Bot spawned in world' });

      // Set up pathfinder movements
      const defaultMove = new Movements(this.bot);
      defaultMove.canDig = false; // Don't break blocks in PvP
      defaultMove.allowSprinting = true;
      this.bot.pathfinder.setMovements(defaultMove);

      // Initialize viewer
      this.initializeViewer();

      this.emit('status', {
        id: this.id,
        status: 'connected',
        position: this.bot.entity.position,
        health: this.bot.health,
        food: this.bot.food,
        viewerUrl: `http://localhost:${this.viewerPort}`
      });
    });

    this.bot.on('chat', (username, message) => {
      this.emit('log', { id: this.id, level: 'chat', message: `<${username}> ${message}` });

      // Parse server responses for login confirmation
      if (message.includes('Successfully logged in') || message.includes('authenticated')) {
        this.emit('log', { id: this.id, level: 'success', message: 'Authentication successful!' });
      }
    });

    this.bot.on('whisper', (username, message) => {
      this.emit('log', { id: this.id, level: 'whisper', message: `[${username} -> me] ${message}` });
    });

    this.bot.on('error', (err) => {
      this.status = 'error';
      this.emit('error', { id: this.id, error: err.message });
      this.emit('log', { id: this.id, level: 'error', message: `Error: ${err.message}` });
    });

    this.bot.on('kicked', (reason) => {
      this.status = 'disconnected';
      this.emit('log', { id: this.id, level: 'error', message: `Kicked: ${reason}` });
    });

    this.bot.on('end', () => {
      this.status = 'disconnected';
      this.emit('log', { id: this.id, level: 'info', message: 'Disconnected from server' });
      this.emit('status', { id: this.id, status: 'disconnected' });
      if (this.viewer) {
        this.viewer.close();
        this.viewer = null;
      }
    });

    this.bot.on('death', () => {
      this.emit('log', { id: this.id, level: 'error', message: 'Bot died!' });
      this.stopAttack();
      this.stopFollow();
    });

    this.bot.on('health', () => {
      this.emit('status', {
        id: this.id,
        health: this.bot.health,
        food: this.bot.food
      });
    });

    this.bot.on('physicsTick', () => {
      // Update position periodically (throttled in manager)
      if (this.bot.entity) {
        this.emit('position', {
          id: this.id,
          position: this.bot.entity.position,
          velocity: this.bot.entity.velocity,
          yaw: this.bot.entity.yaw,
          pitch: this.bot.entity.pitch
        });
      }
    });

    // PvP stop event
    this.bot.on('stoppedAttacking', () => {
      this.attacking = false;
      this.emit('log', { id: this.id, level: 'info', message: 'Stopped attacking' });
    });

    // Pathfinder events
    this.bot.on('path_update', (r) => {
      const nodesPerTick = (r.visitedNodes * 50 / r.time).toFixed(2);
      this.emit('log', {
        id: this.id,
        level: 'info',
        message: `Pathfinding: ${r.visitedNodes} nodes, ${r.time.toFixed(2)}ms (${nodesPerTick} nodes/tick)`
      });
    });

    this.bot.on('goal_reached', () => {
      this.emit('log', { id: this.id, level: 'success', message: 'Goal reached!' });
    });

    this.bot.on('path_reset', (reason) => {
      this.emit('log', { id: this.id, level: 'warning', message: `Path reset: ${reason}` });
    });
  }

  /**
   * Initialize prismarine-viewer for visual observability
   */
  initializeViewer() {
    if (!mineflayerViewer) {
      this.emit('log', {
        id: this.id,
        level: 'info',
        message: '3D viewer not available (prismarine-viewer requires canvas)'
      });
      return;
    }

    try {
      this.viewer = mineflayerViewer(this.bot, {
        port: this.viewerPort,
        firstPerson: true,
        viewDistance: 6
      });
      this.emit('log', {
        id: this.id,
        level: 'success',
        message: `Viewer available at http://localhost:${this.viewerPort}`
      });
    } catch (error) {
      this.emit('log', {
        id: this.id,
        level: 'warning',
        message: `Failed to initialize viewer: ${error.message}`
      });
    }
  }

  /**
   * Send a chat message
   */
  chat(message) {
    if (!this.bot || this.status !== 'connected') {
      this.emit('error', { id: this.id, error: 'Bot is not connected' });
      return;
    }
    this.bot.chat(message);
    this.emit('log', { id: this.id, level: 'info', message: `Sent: ${message}` });
  }

  /**
   * Attack a target player using mineflayer-pvp
   */
  async killPlayer(targetUsername) {
    if (!this.bot || this.status !== 'connected') {
      this.emit('error', { id: this.id, error: 'Bot is not connected' });
      return;
    }

    const targetPlayer = this.bot.players[targetUsername];
    if (!targetPlayer || !targetPlayer.entity) {
      this.emit('log', { id: this.id, level: 'error', message: `Player ${targetUsername} not found` });
      return;
    }

    this.attacking = true;
    this.bot.pvp.attack(targetPlayer.entity);
    this.emit('log', { id: this.id, level: 'info', message: `Attacking ${targetUsername}` });
  }

  /**
   * Stop attacking current target
   */
  stopAttack() {
    if (!this.bot || this.status !== 'connected') return;

    this.bot.pvp.stop();
    this.attacking = false;
    this.emit('log', { id: this.id, level: 'info', message: 'Stopped attacking' });
  }

  /**
   * Follow a player using pathfinder
   */
  followPlayer(targetUsername) {
    if (!this.bot || this.status !== 'connected') {
      this.emit('error', { id: this.id, error: 'Bot is not connected' });
      return;
    }

    if (!targetUsername) {
      this.stopFollow();
      return;
    }

    const targetPlayer = this.bot.players[targetUsername];
    if (!targetPlayer || !targetPlayer.entity) {
      this.emit('log', { id: this.id, level: 'error', message: `Player ${targetUsername} not found` });
      return;
    }

    this.following = true;
    const goal = new goals.GoalFollow(targetPlayer.entity, 2);
    this.bot.pathfinder.setGoal(goal, true); // true = dynamic goal
    this.emit('log', { id: this.id, level: 'info', message: `Following ${targetUsername}` });
  }

  /**
   * Stop following
   */
  stopFollow() {
    if (!this.bot || this.status !== 'connected') return;

    this.following = false;
    this.bot.pathfinder.setGoal(null);
    this.emit('log', { id: this.id, level: 'info', message: 'Stopped following' });
  }

  /**
   * Move to specific coordinates using pathfinder
   */
  moveTo(x, y, z) {
    if (!this.bot || this.status !== 'connected') {
      this.emit('error', { id: this.id, error: 'Bot is not connected' });
      return;
    }

    const goal = new goals.GoalNear(x, y, z, 1);
    this.bot.pathfinder.setGoal(goal);
    this.emit('log', { id: this.id, level: 'info', message: `Moving to (${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)})` });
  }

  /**
   * Move relative to current position (for GUI controls)
   */
  moveRelative(dx, dz) {
    if (!this.bot || this.status !== 'connected') {
      this.emit('error', { id: this.id, error: 'Bot is not connected' });
      return;
    }

    const pos = this.bot.entity.position;
    this.moveTo(pos.x + dx, pos.y, pos.z + dz);
  }

  /**
   * Look at coordinates
   */
  lookAt(x, y, z) {
    if (!this.bot || this.status !== 'connected') return;

    const target = this.bot.vec3(x, y, z);
    this.bot.lookAt(target);
  }

  /**
   * Get current bot state
   */
  getState() {
    if (!this.bot || this.status !== 'connected') {
      return {
        id: this.id,
        username: this.username,
        status: this.status,
        token: this.token ? '***' : null,
        viewerPort: this.viewerPort
      };
    }

    const pos = this.bot.entity?.position;
    return {
      id: this.id,
      username: this.username,
      status: this.status,
      token: this.token ? '***' : null,
      position: pos ? { x: pos.x, y: pos.y, z: pos.z } : null,
      health: this.bot.health,
      food: this.bot.food,
      gameMode: this.bot.game?.gameMode,
      dimension: this.bot.game?.dimension,
      players: Object.keys(this.bot.players).filter(p => p !== this.bot.username),
      viewerPort: this.viewerPort,
      viewerUrl: `http://localhost:${this.viewerPort}`,
      attacking: this.attacking,
      following: this.following,
      yaw: this.bot.entity?.yaw,
      pitch: this.bot.entity?.pitch
    };
  }

  /**
   * Disconnect the bot
   */
  disconnect() {
    if (this.bot) {
      this.bot.pvp?.stop();
      this.bot.pathfinder?.setGoal(null);
      this.bot.quit();
      this.bot = null;
    }
    if (this.viewer) {
      this.viewer.close();
      this.viewer = null;
    }
    this.status = 'disconnected';
    this.attacking = false;
    this.following = false;
  }
}
