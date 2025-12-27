"use client";

import { io, Socket } from "socket.io-client";
import type { BotState, BotCommand, ChatMessage } from "@/types/bot";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export interface ServerConfig {
  host: string;
  port: number;
}

export interface SocketEvents {
  bots_list: (bots: BotState[]) => void;
  bot_created: (data: { id: string; state: BotState }) => void;
  bot_update: (data: { botId: string; state: BotState }) => void;
  bot_removed: (data: { botId: string }) => void;
  bot_error: (data: { botId: string; error: string }) => void;
  chat_message: (message: ChatMessage) => void;
  error: (data: { message: string }) => void;
  server_config: (config: ServerConfig) => void;
}

export function createBot(ign: string, token: string): void {
  getSocket().emit("create_bot", { ign, token });
}

export function removeBot(botId: string): void {
  getSocket().emit("remove_bot", botId);
}

export function sendBotCommand(botId: string, command: BotCommand): void {
  getSocket().emit("bot_command", { botId, command });
}

export function requestBotsList(): void {
  getSocket().emit("get_bots");
}

export function requestServerConfig(): void {
  getSocket().emit("get_server_config");
}

export function updateServerConfig(host: string, port: number): void {
  getSocket().emit("update_server_config", { host, port });
}
