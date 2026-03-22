import mineflayer, { Bot } from "mineflayer";
import pkg from "mineflayer-pathfinder";
const { pathfinder, Movements, goals } = pkg;
import type {
  BotState,
  BotCommand,
  BotPosition,
  BotHealth,
  InventoryItem,
  NearbyEntity,
} from "./types.js";

const DEFAULT_SERVER_HOST = "mcpanel.blockwarriors.ai";
const DEFAULT_SERVER_PORT = 25565;

interface ManagedBot {
  bot: Bot;
  state: BotState;
  movements?: InstanceType<typeof Movements>;
  entityScanInterval?: NodeJS.Timeout;
  attackInterval?: NodeJS.Timeout;
  attackTimeout?: NodeJS.Timeout;
  attackSessionId?: number;
}

const HOSTILE_MOBS = [
  "zombie", "skeleton", "creeper", "spider", "enderman", "witch",
  "blaze", "ghast", "magma_cube", "slime", "phantom", "drowned",
  "husk", "stray", "wither_skeleton", "piglin_brute", "vindicator",
  "pillager", "ravager", "evoker", "vex", "guardian", "elder_guardian"
];

export type BotEventCallback = (botId: string, state: BotState) => void;
export type ChatCallback = (
  botId: string,
  username: string,
  message: string
) => void;
export type ErrorCallback = (botId: string, error: string) => void;

export class BotClient {
  private bots: Map<string, ManagedBot> = new Map();
  private onBotUpdate: BotEventCallback | null = null;
  private onBotChat: ChatCallback | null = null;
  private onBotError: ErrorCallback | null = null;
  private spawnListeners: Map<string, () => void> = new Map();
  private errorListeners: Map<string, (error: string) => void> = new Map();

  setCallbacks(
    onUpdate: BotEventCallback,
    onChat: ChatCallback,
    onError: ErrorCallback
  ) {
    this.onBotUpdate = onUpdate;
    this.onBotChat = onChat;
    this.onBotError = onError;
  }

  async createBot(id: string, ign: string, token: string, host?: string, port?: number): Promise<BotState> {
    if (this.bots.has(id)) {
      throw new Error(`Bot with id ${id} already exists`);
    }

    const initialState: BotState = {
      id,
      ign,
      status: "connecting",
      position: null,
      health: null,
      inventory: [],
      nearbyEntities: [],
      currentAction: "Connecting...",
      lastUpdate: Date.now(),
    };

    const bot = mineflayer.createBot({
      host: host || DEFAULT_SERVER_HOST,
      port: port || DEFAULT_SERVER_PORT,
      username: ign,
      auth: "offline",
      checkTimeoutInterval: 180000,
      keepAlive: true,
      hideErrors: false,
    });

    const managedBot: ManagedBot = { bot, state: initialState };
    this.bots.set(id, managedBot);

    this.setupBotListeners(id, bot, token);

    return initialState;
  }

  waitForSpawn(id: string, timeoutMs = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const managedBot = this.bots.get(id);
      if (!managedBot) {
        reject(new Error(`Bot ${id} not found`));
        return;
      }

      if (managedBot.state.status === "online") {
        resolve();
        return;
      }

      if (managedBot.state.status === "error" || managedBot.state.status === "offline") {
        reject(new Error(`Bot ${id} failed to connect: ${managedBot.state.errorMessage || "unknown error"}`));
        return;
      }

      let settled = false;
      const cleanup = () => {
        this.spawnListeners.delete(id);
        this.errorListeners.delete(id);
      };

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Bot ${id} did not spawn within ${timeoutMs}ms`));
      }, timeoutMs);

      this.spawnListeners.set(id, () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanup();
        resolve();
      });

      this.errorListeners.set(id, (error: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanup();
        reject(new Error(`Bot ${id} failed to connect: ${error}`));
      });
    });
  }

  waitForDeath(id: string, timeoutMs = 120000): Promise<void> {
    return new Promise((resolve, reject) => {
      const managedBot = this.bots.get(id);
      if (!managedBot) {
        reject(new Error(`Bot ${id} not found`));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Bot ${id} did not die within ${timeoutMs}ms`));
      }, timeoutMs);

      managedBot.bot.once("death", () => {
        clearTimeout(timeout);
        resolve();
      });

      managedBot.bot.once("end", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  private clearAttackTimers(id: string): void {
    const managedBot = this.bots.get(id);
    if (!managedBot) return;

    if (managedBot.attackInterval) {
      clearInterval(managedBot.attackInterval);
      managedBot.attackInterval = undefined;
    }
    if (managedBot.attackTimeout) {
      clearTimeout(managedBot.attackTimeout);
      managedBot.attackTimeout = undefined;
    }
    managedBot.attackSessionId = undefined;
  }

  private stopAllActions(id: string): void {
    const managedBot = this.bots.get(id);
    if (!managedBot) return;

    if (managedBot.movements) {
      managedBot.bot.pathfinder.stop();
    }
    managedBot.bot.clearControlStates();
    this.clearAttackTimers(id);
    this.updateBotState(id, { currentAction: "Idle" });
  }

  private isValidAttackSession(id: string, sessionId: number): boolean {
    const managedBot = this.bots.get(id);
    return managedBot?.attackSessionId === sessionId;
  }

  private cleanupBotIntervals(id: string) {
    const managedBot = this.bots.get(id);
    if (!managedBot) return;

    if (managedBot.entityScanInterval) {
      clearInterval(managedBot.entityScanInterval);
      managedBot.entityScanInterval = undefined;
    }
    this.clearAttackTimers(id);
  }

  private removeBotListeners(bot: Bot): void {
    bot.removeAllListeners('spawn');
    bot.removeAllListeners('move');
    bot.removeAllListeners('health');
    bot.removeAllListeners('playerCollect');
    bot.removeAllListeners('message');
    bot.removeAllListeners('chat');
    bot.removeAllListeners('error');
    bot.removeAllListeners('kicked');
    bot.removeAllListeners('end');
    bot.removeAllListeners('death');
  }

  private setupBotListeners(id: string, bot: Bot, token: string) {
    const managedBot = this.bots.get(id);
    if (!managedBot) return;

    // Catch errors on the underlying protocol client to prevent process crash
    (bot as any)._client?.on("error", (err: Error) => {
      // Silently handle — the bot-level error handler will also fire
    });

    bot.once("spawn", () => {
      this.updateBotState(id, {
        status: "online",
        currentAction: "Logging in...",
      });

      bot.loadPlugin(pathfinder);
      const movements = new Movements(bot);
      movements.canDig = false;
      movements.allowSprinting = true;
      movements.allowParkour = false;
      movements.maxDropDown = 4;
      managedBot.movements = movements;

      setTimeout(() => {
        if (!this.bots.has(id)) return;
        bot.chat(`/login ${token}`);
        this.updateBotState(id, { currentAction: "Idle" });
      }, 1000);

      managedBot.entityScanInterval = setInterval(() => {
        this.scanNearbyEntities(id, bot);
      }, 2000);
    });

    let lastMoveUpdate = 0;
    bot.on("move", () => {
      if (!bot.entity) return;

      const now = Date.now();
      if (now - lastMoveUpdate < 500) return;
      lastMoveUpdate = now;

      const pos = bot.entity.position;
      const position: BotPosition = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        yaw: bot.entity.yaw,
        pitch: bot.entity.pitch,
      };
      this.updateBotState(id, { position });
    });

    bot.on("health", () => {
      const health: BotHealth = {
        health: bot.health,
        food: bot.food,
        saturation: bot.foodSaturation,
      };
      this.updateBotState(id, { health });
    });

    bot.on("playerCollect", () => {
      this.updateInventory(id, bot);
    });

    bot.on("message", (jsonMsg) => {
      const message = jsonMsg.toString();
      if (this.onBotChat) {
        this.onBotChat(id, "Server", message);
      }
    });

    bot.on("chat", (username, message) => {
      if (this.onBotChat && username !== bot.username) {
        this.onBotChat(id, username, message);
      }
    });

    bot.on("error", (err) => {
      // Suppress EPIPE/ECONNRESET — these are expected during teleportation
      const isNetworkError = err.message?.includes("EPIPE") || err.message?.includes("ECONNRESET");
      if (!isNetworkError) {
        this.updateBotState(id, {
          status: "error",
          errorMessage: err.message,
          currentAction: "Error",
        });
      }
      if (this.onBotError) {
        this.onBotError(id, err.message);
      }
      this.cleanupBotIntervals(id);
    });

    bot.on("kicked", (reason) => {
      const reasonStr =
        typeof reason === "string" ? reason : JSON.stringify(reason);
      this.updateBotState(id, {
        status: "error",
        errorMessage: `Kicked: ${reasonStr}`,
        currentAction: "Disconnected",
      });
      if (this.onBotError) {
        this.onBotError(id, `Kicked: ${reasonStr}`);
      }
      this.cleanupBotIntervals(id);
    });

    bot.on("end", () => {
      this.updateBotState(id, {
        status: "offline",
        currentAction: "Disconnected",
      });
      this.cleanupBotIntervals(id);
    });

    bot.on("death", () => {
      this.updateBotState(id, { currentAction: "Dead - Respawning..." });
      setTimeout(() => {
        if (this.bots.has(id) && bot.entity) {
          this.updateBotState(id, { currentAction: "Idle" });
        }
      }, 3000);
    });
  }

  private updateInventory(id: string, bot: Bot) {
    const inventory: InventoryItem[] = bot.inventory
      .items()
      .map((item) => ({
        name: item.name,
        count: item.count,
        slot: item.slot,
      }));
    this.updateBotState(id, { inventory });
  }

  private updateBotState(id: string, updates: Partial<BotState>) {
    const managedBot = this.bots.get(id);
    if (!managedBot) return;

    managedBot.state = {
      ...managedBot.state,
      ...updates,
      lastUpdate: Date.now(),
    };

    if (this.onBotUpdate) {
      this.onBotUpdate(id, managedBot.state);
    }

    if (updates.status === "online") {
      const spawnCb = this.spawnListeners.get(id);
      if (spawnCb) spawnCb();
    }

    if (updates.status === "error" || updates.status === "offline") {
      const errorCb = this.errorListeners.get(id);
      if (errorCb) errorCb(updates.errorMessage || managedBot.state.errorMessage || "unknown error");
    }
  }

  private scanNearbyEntities(id: string, bot: Bot) {
    if (!bot.entity) return;

    const botPos = bot.entity.position;
    const entities = Object.values(bot.entities);

    const nearbyEntities: NearbyEntity[] = entities
      .filter((entity) => {
        if (!entity || entity === bot.entity) return false;
        const distance = entity.position.distanceTo(botPos);
        return distance <= 32;
      })
      .map((entity) => {
        const distance = entity.position.distanceTo(botPos);
        const isPlayer = entity.type === "player";
        const entityName = entity.name || entity.type || "unknown";
        const isHostile = HOSTILE_MOBS.includes(entityName.toLowerCase());

        return {
          id: entity.id,
          type: entity.type || "unknown",
          name: entityName,
          displayName: isPlayer
            ? (entity.username || entityName)
            : entityName.replace(/_/g, " "),
          position: {
            x: entity.position.x,
            y: entity.position.y,
            z: entity.position.z,
          },
          distance: Math.round(distance * 10) / 10,
          isPlayer,
          isHostile,
          health: entity.health,
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    this.updateBotState(id, { nearbyEntities });
  }

  async executeCommand(id: string, command: BotCommand): Promise<void> {
    const managedBot = this.bots.get(id);
    if (!managedBot) {
      throw new Error(`Bot ${id} not found`);
    }

    const { bot, movements } = managedBot;

    switch (command.type) {
      case "chat": {
        const message = command.payload?.message as string;
        if (message) {
          bot.chat(message);
          this.updateBotState(id, { currentAction: `Chatting: ${message}` });
        }
        break;
      }

      case "goto": {
        const { x, y, z } = command.payload as { x: number; y: number; z: number };
        if (movements) {
          bot.pathfinder.setMovements(movements);
          bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
          this.updateBotState(id, {
            currentAction: `Moving to ${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)}`,
          });
        }
        break;
      }

      case "follow": {
        const playerName = command.payload?.player as string;
        const player = bot.players[playerName];
        if (player && player.entity && movements) {
          bot.pathfinder.setMovements(movements);
          bot.pathfinder.setGoal(
            new goals.GoalFollow(player.entity, 3),
            true
          );
          this.updateBotState(id, {
            currentAction: `Following ${playerName}`,
          });
        }
        break;
      }

      case "stop":
        this.stopAllActions(id);
        break;

      case "jump":
        bot.setControlState("jump", true);
        setTimeout(() => {
          if (this.bots.has(id)) {
            bot.setControlState("jump", false);
          }
        }, 500);
        break;

      case "sneak": {
        const sneaking = command.payload?.enabled as boolean;
        bot.setControlState("sneak", sneaking);
        break;
      }

      case "sprint": {
        const sprinting = command.payload?.enabled as boolean;
        bot.setControlState("sprint", sprinting);
        break;
      }

      case "look": {
        const { yaw, pitch } = command.payload as { yaw: number; pitch: number };
        await bot.look(yaw, pitch);
        break;
      }

      case "attack": {
        const target = bot.nearestEntity();
        if (!target) {
          this.updateBotState(id, { currentAction: "No target in range" });
          return;
        }
        bot.attack(target);
        this.updateBotState(id, { currentAction: "Attacking" });
        break;
      }

      case "attack_entity": {
        const entityId = command.payload?.entityId as number;
        const entityTarget = bot.entities[entityId];
        if (!entityTarget) {
          this.updateBotState(id, { currentAction: "Entity no longer exists" });
          return;
        }
        if (movements) {
          this.clearAttackTimers(id);

          const sessionId = Math.random();
          managedBot.attackSessionId = sessionId;

          bot.pathfinder.setMovements(movements);
          bot.pathfinder.setGoal(new goals.GoalFollow(entityTarget, 2), true);

          const entityName = entityTarget.username || entityTarget.name || "entity";
          this.updateBotState(id, {
            currentAction: `Attacking ${entityName}`
          });

          const intervalId = setInterval(() => {
            if (!this.isValidAttackSession(id, sessionId)) {
              clearInterval(intervalId);
              return;
            }

            const currentEntity = bot.entities[entityId];
            if (!currentEntity || !bot.entity) {
              this.stopAllActions(id);
              return;
            }

            const distance = currentEntity.position.distanceTo(bot.entity.position);
            if (distance <= 4) {
              bot.attack(currentEntity);
            }
          }, 500);
          managedBot.attackInterval = intervalId;

          managedBot.attackTimeout = setTimeout(() => {
            if (this.isValidAttackSession(id, sessionId)) {
              this.stopAllActions(id);
            }
          }, 30000);
        }
        break;
      }

      case "custom": {
        const customCmd = command.payload?.command as string;
        if (customCmd) {
          bot.chat(customCmd);
        }
        break;
      }
    }
  }

  removeBot(id: string): boolean {
    const managedBot = this.bots.get(id);
    if (!managedBot) return false;

    this.cleanupBotIntervals(id);
    this.removeBotListeners(managedBot.bot);
    managedBot.bot.quit();
    this.bots.delete(id);
    return true;
  }

  removeAllBots(): void {
    for (const id of this.bots.keys()) {
      this.removeBot(id);
    }
  }

  getBotState(id: string): BotState | null {
    return this.bots.get(id)?.state || null;
  }

  getAllBots(): BotState[] {
    return Array.from(this.bots.values()).map((mb) => mb.state);
  }

  getBotCount(): number {
    return this.bots.size;
  }
}
