import { BotInstance } from './bot-instance.js';
import { EventEmitter } from 'events';

/**
 * Manages multiple bot instances
 */
export class BotManager extends EventEmitter {
  constructor() {
    super();
    this.bots = new Map(); // id -> BotInstance
    this.nextId = 1;
    this.nextViewerPort = 3010; // Start viewer ports from 3010
    this.positionUpdateThrottle = new Map(); // id -> last update timestamp
  }

  /**
   * Create a new bot
   */
  createBot(username) {
    const id = this.nextId++;
    const viewerPort = this.nextViewerPort++;
    const bot = new BotInstance(id, username, viewerPort);

    // Forward all bot events to manager
    bot.on('log', (data) => this.emit('log', data));
    bot.on('error', (data) => this.emit('error', data));
    bot.on('status', (data) => this.emit('status', data));

    // Throttle position updates (only send every 500ms)
    bot.on('position', (data) => {
      const lastUpdate = this.positionUpdateThrottle.get(id) || 0;
      const now = Date.now();
      if (now - lastUpdate > 500) {
        this.positionUpdateThrottle.set(id, now);
        this.emit('position', data);
      }
    });

    this.bots.set(id, bot);
    this.emit('bot-created', { id, username });
    this.emit('log', { id, level: 'info', message: `Bot created: ${username}` });

    return id;
  }

  /**
   * Connect a bot with a token
   */
  async connectBot(id, token) {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot ${id} not found`);
    }

    await bot.connect(token);
  }

  /**
   * Send a chat message from a bot
   */
  chatAsBot(id, message) {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot ${id} not found`);
    }

    bot.chat(message);
  }

  /**
   * Make a bot attack a target player
   */
  killPlayer(botId, targetUsername) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.killPlayer(targetUsername);
  }

  /**
   * Stop a bot from attacking
   */
  stopAttack(botId) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.stopAttack();
  }

  /**
   * Make a bot follow a player
   */
  followPlayer(botId, targetUsername) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.followPlayer(targetUsername);
  }

  /**
   * Make a bot move to coordinates
   */
  moveTo(botId, x, y, z) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.moveTo(x, y, z);
  }

  /**
   * Make a bot move relative to current position
   */
  moveRelative(botId, dx, dz) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.moveRelative(dx, dz);
  }

  /**
   * Stop a bot from following
   */
  stopFollow(botId) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.stopFollow();
  }

  /**
   * Get all bot states
   */
  getAllStates() {
    const states = [];
    for (const [id, bot] of this.bots.entries()) {
      states.push(bot.getState());
    }
    return states;
  }

  /**
   * Get a specific bot state
   */
  getBotState(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot ${id} not found`);
    }

    return bot.getState();
  }

  /**
   * Disconnect a bot
   */
  disconnectBot(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot ${id} not found`);
    }

    bot.disconnect();
  }

  /**
   * Remove a bot completely
   */
  removeBot(id) {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot ${id} not found`);
    }

    bot.disconnect();
    this.bots.delete(id);
    this.positionUpdateThrottle.delete(id);
    this.emit('bot-removed', { id });
    this.emit('log', { id, level: 'info', message: `Bot removed` });
  }

  /**
   * Disconnect all bots
   */
  disconnectAll() {
    for (const [id, bot] of this.bots.entries()) {
      bot.disconnect();
    }
  }

  /**
   * Remove all bots
   */
  removeAll() {
    for (const id of this.bots.keys()) {
      this.removeBot(id);
    }
  }
}
