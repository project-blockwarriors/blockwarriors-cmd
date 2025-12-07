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
} from "@/types/bot";

const DEFAULT_SERVER_HOST = "mcpanel.blockwarriors.ai";
const DEFAULT_SERVER_PORT = 25565;

interface ManagedBot {
  bot: Bot;
  state: BotState;
  movements?: InstanceType<typeof Movements>;
  entityScanInterval?: NodeJS.Timeout;
  attackInterval?: NodeJS.Timeout;
}

const HOSTILE_MOBS = [
  "zombie", "skeleton", "creeper", "spider", "enderman", "witch",
  "blaze", "ghast", "magma_cube", "slime", "phantom", "drowned",
  "husk", "stray", "wither_skeleton", "piglin_brute", "vindicator",
  "pillager", "ravager", "evoker", "vex", "guardian", "elder_guardian"
];

type BotEventCallback = (botId: string, state: BotState) => void;
type ChatCallback = (
  botId: string,
  username: string,
  message: string
) => void;
type ErrorCallback = (botId: string, error: string) => void;

class BotManager {
  private bots: Map<string, ManagedBot> = new Map();
  private onBotUpdate: BotEventCallback | null = null;
  private onBotChat: ChatCallback | null = null;
  private onBotError: ErrorCallback | null = null;

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
      token,
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
      version: "1.20.6",
      auth: "offline",
      checkTimeoutInterval: 60000, // Increase timeout check interval to 60s
      keepAlive: true,
      hideErrors: false,
    });

    const managedBot: ManagedBot = { bot, state: initialState };
    this.bots.set(id, managedBot);

    this.setupBotListeners(id, bot, token);

    return initialState;
  }

  private setupBotListeners(id: string, bot: Bot, token: string) {
    const managedBot = this.bots.get(id);
    if (!managedBot) return;

    bot.once("spawn", () => {
      this.updateBotState(id, {
        status: "online",
        currentAction: "Logging in...",
      });

      bot.loadPlugin(pathfinder);
      const movements = new Movements(bot);
      // Optimize movements for performance
      movements.canDig = false; // Don't break blocks
      movements.allowSprinting = true;
      movements.allowParkour = false; // Disable parkour for stability
      movements.maxDropDown = 4; // Limit fall distance
      managedBot.movements = movements;

      setTimeout(() => {
        bot.chat(`/login ${token}`);
        this.updateBotState(id, { currentAction: "Idle" });
      }, 1000);

      // Reduce entity scan frequency to ease CPU load
      managedBot.entityScanInterval = setInterval(() => {
        this.scanNearbyEntities(id, bot);
      }, 2000); // Changed from 1000ms to 2000ms
    });

    // Throttle move updates to reduce network/CPU load
    let lastMoveUpdate = 0;
    bot.on("move", () => {
      const now = Date.now();
      if (now - lastMoveUpdate < 500) return; // Only update position every 500ms
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
      this.updateBotState(id, {
        status: "error",
        errorMessage: err.message,
        currentAction: "Error",
      });
      if (this.onBotError) {
        this.onBotError(id, err.message);
      }

      // Clean up the bot's interval
      const managedBot = this.bots.get(id);
      if (managedBot?.entityScanInterval) {
        clearInterval(managedBot.entityScanInterval);
      }
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

      // Clean up the bot's interval
      const managedBot = this.bots.get(id);
      if (managedBot?.entityScanInterval) {
        clearInterval(managedBot.entityScanInterval);
      }
    });

    bot.on("end", () => {
      this.updateBotState(id, {
        status: "offline",
        currentAction: "Disconnected",
      });

      // Clean up the bot's interval to prevent memory leak
      const managedBot = this.bots.get(id);
      if (managedBot?.entityScanInterval) {
        clearInterval(managedBot.entityScanInterval);
      }
    });

    bot.on("death", () => {
      this.updateBotState(id, { currentAction: "Dead - Respawning..." });
      setTimeout(() => {
        if (bot.entity) {
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
      case "chat":
        const message = command.payload?.message as string;
        if (message) {
          bot.chat(message);
          this.updateBotState(id, { currentAction: `Chatting: ${message}` });
        }
        break;

      case "goto":
        const { x, y, z } = command.payload as { x: number; y: number; z: number };
        if (movements) {
          bot.pathfinder.setMovements(movements);
          bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
          this.updateBotState(id, {
            currentAction: `Moving to ${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)}`,
          });
        }
        break;

      case "follow":
        const playerName = command.payload?.player as string;
        const player = bot.players[playerName];
        if (player && player.entity && movements) {
          bot.pathfinder.setMovements(movements);
          // Use larger follow range to reduce pathfinding recalculations
          bot.pathfinder.setGoal(
            new goals.GoalFollow(player.entity, 3),
            true
          );
          this.updateBotState(id, {
            currentAction: `Following ${playerName}`,
          });
        }
        break;

      case "stop":
        bot.pathfinder.stop();
        bot.clearControlStates();

        // Clear any ongoing attack interval
        if (managedBot.attackInterval) {
          clearInterval(managedBot.attackInterval);
          managedBot.attackInterval = undefined;
        }

        this.updateBotState(id, { currentAction: "Idle" });
        break;

      case "jump":
        bot.setControlState("jump", true);
        setTimeout(() => bot.setControlState("jump", false), 500);
        break;

      case "sneak":
        const sneaking = command.payload?.enabled as boolean;
        bot.setControlState("sneak", sneaking);
        this.updateBotState(id, {
          currentAction: sneaking ? "Sneaking" : "Idle",
        });
        break;

      case "sprint":
        const sprinting = command.payload?.enabled as boolean;
        bot.setControlState("sprint", sprinting);
        break;

      case "look":
        const { yaw, pitch } = command.payload as { yaw: number; pitch: number };
        await bot.look(yaw, pitch);
        break;

      case "attack":
        const target = bot.nearestEntity();
        if (target) {
          bot.attack(target);
          this.updateBotState(id, { currentAction: "Attacking" });
        }
        break;

      case "attack_entity":
        const entityId = command.payload?.entityId as number;
        const entityTarget = bot.entities[entityId];
        if (entityTarget && movements) {
          // Clear any existing attack interval
          if (managedBot.attackInterval) {
            clearInterval(managedBot.attackInterval);
            managedBot.attackInterval = undefined;
          }

          bot.pathfinder.setMovements(movements);
          bot.pathfinder.setGoal(new goals.GoalFollow(entityTarget, 2), true);

          const entityName = entityTarget.username || entityTarget.name || "entity";
          this.updateBotState(id, {
            currentAction: `Attacking ${entityName}`
          });

          managedBot.attackInterval = setInterval(() => {
            const currentEntity = bot.entities[entityId];
            if (!currentEntity || !bot.entity) {
              if (managedBot.attackInterval) {
                clearInterval(managedBot.attackInterval);
                managedBot.attackInterval = undefined;
              }
              bot.pathfinder.stop();
              this.updateBotState(id, { currentAction: "Idle" });
              return;
            }

            const distance = currentEntity.position.distanceTo(bot.entity.position);
            if (distance <= 4) {
              bot.attack(currentEntity);
            }
          }, 500);

          // Auto-stop attack after 30 seconds
          setTimeout(() => {
            if (managedBot.attackInterval) {
              clearInterval(managedBot.attackInterval);
              managedBot.attackInterval = undefined;
            }
          }, 30000);
        }
        break;

      case "custom":
        const customCmd = command.payload?.command as string;
        if (customCmd) {
          bot.chat(customCmd);
        }
        break;
    }
  }

  removeBot(id: string): boolean {
    const managedBot = this.bots.get(id);
    if (!managedBot) return false;

    // Clean up all intervals
    if (managedBot.entityScanInterval) {
      clearInterval(managedBot.entityScanInterval);
    }
    if (managedBot.attackInterval) {
      clearInterval(managedBot.attackInterval);
    }

    managedBot.bot.quit();
    this.bots.delete(id);
    return true;
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

export const botManager = new BotManager();
