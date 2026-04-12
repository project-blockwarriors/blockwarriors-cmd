/**
 * Player-facing types for BlockWarriors bot development.
 */

/** 3D position with distance calculation. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
  distanceTo(other: { x: number; y: number; z: number }): number;
}

/** Information about a nearby entity (player, mob, etc). */
export interface EntityInfo {
  id: number;
  name: string;
  type: string;
  position: Vec3;
  distance: number;
  health?: number;
  isPlayer: boolean;
}

/** An item in the bot's inventory. */
export interface Item {
  name: string;
  count: number;
  slot: number;
}

/** Current game state snapshot. */
export interface GameState {
  matchId: string;
  gameType: string;
  state: "waiting" | "countdown" | "in_progress" | "finished";
  durationMs: number;
}

/**
 * The BotAPI provides methods to control your bot and read game state.
 * Passed to every Strategy callback.
 */
export interface BotAPI {
  // ---- Movement ----

  /** Navigate to coordinates using pathfinding (non-blocking). */
  goto(x: number, y: number, z: number): void;

  /** Continuously follow a player by name. */
  follow(playerName: string): void;

  /** Stop all movement and pathfinding. */
  stop(): void;

  /** Jump once. */
  jump(): void;

  /** Toggle sprinting. */
  sprint(enabled: boolean): void;

  /** Toggle sneaking. */
  sneak(enabled: boolean): void;

  /** Set head rotation (radians). */
  look(yaw: number, pitch: number): void;

  // ---- Combat ----

  /** Swing the held item at the nearest entity in range. */
  attack(): void;

  /** Attack a specific entity by ID (follows and attacks). */
  attackEntity(entityId: number): void;

  // ---- Communication ----

  /** Send a chat message. */
  chat(message: string): void;

  // ---- State (read-only) ----

  /** Bot's current position. */
  readonly position: Vec3;

  /** Current health (0–20). */
  readonly health: number;

  /** Current food level (0–20). */
  readonly food: number;

  /** Items in inventory. */
  readonly inventory: readonly Item[];

  /** All entities within render distance. */
  readonly nearbyEntities: readonly EntityInfo[];

  /** All players within render distance. */
  readonly nearbyPlayers: readonly EntityInfo[];

  /** Enemy team players within render distance. */
  readonly nearbyEnemies: readonly EntityInfo[];
}

/**
 * Strategy interface — the main thing players implement.
 * Only onSpawn and onTick are required.
 */
export interface Strategy {
  /** Called once when the bot spawns in the world. */
  onSpawn(bot: BotAPI): void;

  /** Called every 500ms while the match is active. */
  onTick(bot: BotAPI, state: GameState): void;

  /** Called when the bot dies (optional). */
  onDeath?(bot: BotAPI): void;

  /** Called when the bot takes damage (optional). */
  onDamage?(bot: BotAPI, attacker?: EntityInfo): void;

  /** Called when a chat message is received (optional). */
  onChat?(bot: BotAPI, sender: string, message: string): void;
}

/** Configuration for creating a BlockWarriorsBot. */
export interface BotConfig {
  /** Minecraft server host. */
  host: string;

  /** Minecraft server port. */
  port: number;

  /** In-game name for the bot. */
  ign: string;

  /** Match authentication token. */
  token: string;

  /** Your bot strategy. */
  strategy: Strategy;
}
