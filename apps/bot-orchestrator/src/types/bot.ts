export type {
  BotStatus,
  BotPosition,
  BotHealth,
  InventoryItem,
  NearbyEntity,
  BotState,
  BotCommand,
  CreateBotRequest,
  ServerMessage,
  ChatMessage,
} from "@packages/bot-client";

// MinimapData is UI-specific, kept here
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
