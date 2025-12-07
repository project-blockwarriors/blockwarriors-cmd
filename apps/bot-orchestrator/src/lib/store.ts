"use client";

import { create } from "zustand";
import type { BotState, ChatMessage, BotCommand } from "@/types/bot";
import type { ServerConfig } from "./socket";
import {
  getSocket,
  createBot as socketCreateBot,
  removeBot as socketRemoveBot,
  sendBotCommand as socketSendCommand,
  updateServerConfig as socketUpdateServerConfig,
} from "./socket";

interface BotStore {
  bots: Map<string, BotState>;
  selectedBotId: string | null;
  chatMessages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
  errorBotId: string | null;
  serverConfig: ServerConfig;

  // Actions
  setBots: (bots: BotState[]) => void;
  updateBot: (botId: string, state: BotState) => void;
  removeBot: (botId: string) => void;
  selectBot: (botId: string | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setServerConfig: (config: ServerConfig) => void;

  // Socket actions
  createBot: (ign: string, token: string) => void;
  deleteBot: (botId: string) => void;
  sendCommand: (botId: string, command: BotCommand) => void;
  updateServerConfig: (host: string, port: number) => void;
  initSocket: () => void;
}

export const useBotStore = create<BotStore>((set, get) => ({
  bots: new Map(),
  selectedBotId: null,
  chatMessages: [],
  isConnected: false,
  error: null,
  errorBotId: null,
  serverConfig: { host: "mcpanel.blockwarriors.ai", port: 25565 },

  setBots: (bots) => {
    const botMap = new Map<string, BotState>();
    bots.forEach((bot) => botMap.set(bot.id, bot));
    set({ bots: botMap });
  },

  updateBot: (botId, state) => {
    set((prev) => {
      const newBots = new Map(prev.bots);
      newBots.set(botId, state);
      return { bots: newBots };
    });
  },

  removeBot: (botId) => {
    set((prev) => {
      const newBots = new Map(prev.bots);
      newBots.delete(botId);
      return {
        bots: newBots,
        selectedBotId: prev.selectedBotId === botId ? null : prev.selectedBotId,
      };
    });
  },

  selectBot: (botId) => set({ selectedBotId: botId }),

  addChatMessage: (message) => {
    set((prev) => ({
      chatMessages: [...prev.chatMessages.slice(-99), message],
    }));
  },

  setConnected: (connected) => set({ isConnected: connected }),

  setError: (error) => {
    if (error === null) {
      const errorBotId = get().errorBotId;
      if (errorBotId) {
        console.log("Dismissing error and removing bot:", errorBotId);
        // Remove the bot from the backend and local state
        get().deleteBot(errorBotId);
      }
      set({ error: null, errorBotId: null });
    } else {
      set({ error });
    }
  },

  setServerConfig: (config) => set({ serverConfig: config }),

  createBot: (ign, token) => {
    socketCreateBot(ign, token);
  },

  deleteBot: (botId) => {
    socketRemoveBot(botId);
  },

  sendCommand: (botId, command) => {
    socketSendCommand(botId, command);
  },

  updateServerConfig: (host, port) => {
    socketUpdateServerConfig(host, port);
  },

  initSocket: () => {
    const socket = getSocket();

    socket.on("connect", () => {
      set({ isConnected: true, error: null });
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("bots_list", (bots: BotState[]) => {
      get().setBots(bots);
    });

    socket.on("bot_created", (data: { id: string; state: BotState }) => {
      get().updateBot(data.id, data.state);
    });

    socket.on("bot_update", (data: { botId: string; state: BotState }) => {
      get().updateBot(data.botId, data.state);
    });

    socket.on("bot_removed", (data: { botId: string }) => {
      get().removeBot(data.botId);
    });

    socket.on("bot_error", (data: { botId: string; error: string }) => {
      // Update the bot state to show error
      const bot = get().bots.get(data.botId);
      if (bot) {
        get().updateBot(data.botId, { ...bot, status: "error", errorMessage: data.error });
      }
      set({ error: `Bot ${data.botId}: ${data.error}`, errorBotId: data.botId });
    });

    socket.on("chat_message", (message: ChatMessage) => {
      get().addChatMessage(message);
    });

    socket.on("error", (data: { message: string }) => {
      set({ error: data.message });
    });

    socket.on("server_config", (config: ServerConfig) => {
      console.log("Received server_config:", config);
      set({ serverConfig: config });
    });
  },
}));
