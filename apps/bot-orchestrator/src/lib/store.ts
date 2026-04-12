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
  socketInitialized: boolean;

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
  socketInitialized: false,

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
      const state = get();
      if (state.errorBotId) {
        console.log("Dismissing error and removing bot:", state.errorBotId);
        get().deleteBot(state.errorBotId);
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
    if (get().socketInitialized) return;

    const socket = getSocket();

    const registerEvent = <T = any>(event: string, handler: (data: T) => void) => {
      socket.off(event).on(event, handler);
    };

    registerEvent("connect", () => {
      set({ isConnected: true, error: null });
    });

    registerEvent("disconnect", () => {
      set({ isConnected: false });
    });

    registerEvent<BotState[]>("bots_list", (bots) => {
      get().setBots(bots);
    });

    registerEvent<{ id: string; state: BotState }>("bot_created", (data) => {
      get().updateBot(data.id, data.state);
    });

    registerEvent<{ botId: string; state: BotState }>("bot_update", (data) => {
      get().updateBot(data.botId, data.state);
    });

    registerEvent<{ botId: string }>("bot_removed", (data) => {
      get().removeBot(data.botId);
    });

    registerEvent<{ botId: string; error: string }>("bot_error", (data) => {
      const bot = get().bots.get(data.botId);
      if (bot) {
        get().updateBot(data.botId, { ...bot, status: "error", errorMessage: data.error });
      }
      set({ error: `Bot ${data.botId}: ${data.error}`, errorBotId: data.botId });
    });

    registerEvent<ChatMessage>("chat_message", (message) => {
      get().addChatMessage(message);
    });

    registerEvent<{ message: string }>("error", (data) => {
      set({ error: data.message, errorBotId: null });
    });

    registerEvent<ServerConfig>("server_config", (config) => {
      console.log("Received server_config:", config);
      set({ serverConfig: config });
    });

    set({ socketInitialized: true });
  },
}));
