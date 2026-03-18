import { BotClient } from "@packages/bot-client";
import type { BotState, NearbyEntity } from "@packages/bot-client";
import type { BotAPI, BotConfig, EntityInfo, GameState, Item, Strategy, Vec3 } from "./types.js";

const TICK_INTERVAL_MS = 500;
const BOT_ID = "sdk-bot";

/**
 * High-level bot class that wraps BotClient with the Strategy pattern.
 * Players create an instance, pass their Strategy, and call start().
 */
export class BlockWarriorsBot {
  private client: BotClient;
  private config: BotConfig;
  private tickInterval: NodeJS.Timeout | null = null;
  private started = false;
  private botIgn: string;
  private matchStartTime = 0;

  constructor(config: BotConfig) {
    this.config = config;
    this.botIgn = config.ign;
    this.client = new BotClient();
  }

  /** Connect to the server and start running the strategy. */
  async start(): Promise<void> {
    if (this.started) {
      throw new Error("Bot already started");
    }
    this.started = true;

    // Set up chat callback for strategy
    this.client.setCallbacks(
      () => {},
      (_botId, username, message) => {
        if (this.config.strategy.onChat) {
          this.config.strategy.onChat(this.createBotAPI(), username, message);
        }
      },
      (_botId, error) => {
        console.error(`[BlockWarriorsBot] Error: ${error}`);
      }
    );

    // Create and connect the bot
    await this.client.createBot(
      BOT_ID,
      this.config.ign,
      this.config.token,
      this.config.host,
      this.config.port
    );

    // Wait for spawn
    await this.client.waitForSpawn(BOT_ID, 60000);
    console.log(`[BlockWarriorsBot] ${this.botIgn} spawned`);

    // Call onSpawn
    this.config.strategy.onSpawn(this.createBotAPI());

    // Set up death listener
    this.setupDeathListener();

    // Start tick loop
    this.matchStartTime = Date.now();
    this.tickInterval = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);

    console.log(`[BlockWarriorsBot] ${this.botIgn} strategy running`);
  }

  /** Stop the bot and disconnect. */
  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.client.removeAllBots();
    this.started = false;
    console.log(`[BlockWarriorsBot] ${this.botIgn} stopped`);
  }

  /** Wait for the bot to die (useful for PvP). */
  async waitForDeath(timeoutMs = 120000): Promise<void> {
    return this.client.waitForDeath(BOT_ID, timeoutMs);
  }

  private tick(): void {
    try {
      const state = this.client.getBotState(BOT_ID);
      if (!state || state.status !== "online") return;

      const gameState: GameState = {
        matchId: "",
        gameType: "",
        state: "in_progress",
        durationMs: Date.now() - this.matchStartTime,
      };

      this.config.strategy.onTick(this.createBotAPI(), gameState);
    } catch (error) {
      console.error(`[BlockWarriorsBot] Tick error:`, error);
    }
  }

  private setupDeathListener(): void {
    // Poll for death state changes
    let wasDead = false;
    const deathCheck = setInterval(() => {
      const state = this.client.getBotState(BOT_ID);
      if (!state) {
        clearInterval(deathCheck);
        return;
      }

      const isDead = state.currentAction === "Dead - Respawning...";
      if (isDead && !wasDead && this.config.strategy.onDeath) {
        this.config.strategy.onDeath(this.createBotAPI());
      }
      wasDead = isDead;
    }, 250);
  }

  private createBotAPI(): BotAPI {
    const state = this.client.getBotState(BOT_ID);
    const client = this.client;
    const ign = this.botIgn;

    const position: Vec3 = state?.position
      ? {
          x: state.position.x,
          y: state.position.y,
          z: state.position.z,
          distanceTo(other: { x: number; y: number; z: number }) {
            return Math.sqrt(
              (this.x - other.x) ** 2 +
              (this.y - other.y) ** 2 +
              (this.z - other.z) ** 2
            );
          },
        }
      : { x: 0, y: 0, z: 0, distanceTo: () => Infinity };

    const toEntityInfo = (e: NearbyEntity): EntityInfo => ({
      id: e.id,
      name: e.displayName || e.name,
      type: e.type,
      position: {
        x: e.position.x,
        y: e.position.y,
        z: e.position.z,
        distanceTo(other: { x: number; y: number; z: number }) {
          return Math.sqrt(
            (this.x - other.x) ** 2 +
            (this.y - other.y) ** 2 +
            (this.z - other.z) ** 2
          );
        },
      },
      distance: e.distance,
      health: e.health,
      isPlayer: e.isPlayer,
    });

    const entities = (state?.nearbyEntities ?? []).map(toEntityInfo);
    const players = entities.filter((e) => e.isPlayer);
    const enemies = players.filter((e) => e.name !== ign);

    const inventory: Item[] = (state?.inventory ?? []).map((item) => ({
      name: item.name,
      count: item.count,
      slot: item.slot,
    }));

    return {
      // Movement
      goto(x: number, y: number, z: number) {
        client.executeCommand(BOT_ID, { type: "goto", payload: { x, y, z } });
      },
      follow(playerName: string) {
        client.executeCommand(BOT_ID, { type: "follow", payload: { player: playerName } });
      },
      stop() {
        client.executeCommand(BOT_ID, { type: "stop" });
      },
      jump() {
        client.executeCommand(BOT_ID, { type: "jump" });
      },
      sprint(enabled: boolean) {
        client.executeCommand(BOT_ID, { type: "sprint", payload: { enabled } });
      },
      sneak(enabled: boolean) {
        client.executeCommand(BOT_ID, { type: "sneak", payload: { enabled } });
      },
      look(yaw: number, pitch: number) {
        client.executeCommand(BOT_ID, { type: "look", payload: { yaw, pitch } });
      },

      // Combat
      attack() {
        client.executeCommand(BOT_ID, { type: "attack" });
      },
      attackEntity(entityId: number) {
        client.executeCommand(BOT_ID, { type: "attack_entity", payload: { entityId } });
      },

      // Communication
      chat(message: string) {
        client.executeCommand(BOT_ID, { type: "chat", payload: { message } });
      },

      // State
      position,
      health: state?.health?.health ?? 20,
      food: state?.health?.food ?? 20,
      inventory,
      nearbyEntities: entities,
      nearbyPlayers: players,
      nearbyEnemies: enemies,
    };
  }
}
