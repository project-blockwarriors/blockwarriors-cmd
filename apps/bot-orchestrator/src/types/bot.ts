export type BotStatus = "connecting" | "online" | "offline" | "error";

export interface BotPosition {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

export interface BotHealth {
  health: number;
  food: number;
  saturation: number;
}

export interface InventoryItem {
  name: string;
  count: number;
  slot: number;
}

export interface NearbyEntity {
  id: number;
  type: string;
  name: string;
  displayName: string;
  position: { x: number; y: number; z: number };
  distance: number;
  isPlayer: boolean;
  isHostile: boolean;
  health?: number;
}

export interface BotState {
  id: string;
  ign: string;
  status: BotStatus;
  position: BotPosition | null;
  health: BotHealth | null;
  inventory: InventoryItem[];
  nearbyEntities: NearbyEntity[];
  currentAction: string;
  lastUpdate: number;
  errorMessage?: string;
}

export interface BotCommand {
  type:
    | "move"
    | "look"
    | "attack"
    | "attack_entity"
    | "chat"
    | "use"
    | "jump"
    | "sneak"
    | "sprint"
    | "stop"
    | "goto"
    | "follow"
    | "custom";
  payload?: Record<string, unknown>;
}

export interface CreateBotRequest {
  ign: string;
  token: string;
}

export interface ServerMessage {
  type:
    | "bot_created"
    | "bot_update"
    | "bot_removed"
    | "bot_error"
    | "chat_message"
    | "bots_list";
  data: unknown;
}

export interface ChatMessage {
  botId: string;
  username: string;
  message: string;
  timestamp: number;
}

export interface MinimapData {
  centerX: number;
  centerZ: number;
  scale: number;
  bots: Array<{
    id: string;
    ign: string;
    x: number;
    z: number;
    color: string;
  }>;
}
