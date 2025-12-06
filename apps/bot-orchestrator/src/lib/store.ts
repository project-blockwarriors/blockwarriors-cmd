"use client";

import { create } from "zustand";
import type { BotState, ChatMessage, BotCommand } from "@/types/bot";
import {
  getSocket,
  createBot as socketCreateBot,
  removeBot as socketRemoveBot,
  sendBotCommand as socketSendCommand,
} from "./socket";

interface BotStore {
  bots: Map<string, BotState>;
  selectedBotId: string | null;
  chatMessages: ChatMessage[];
  isConnected: boolean;
  error: string | null;

  // Actions
  setBots: (bots: BotState[]) => void;
  updateBot: (botId: string, state: BotState) => void;
  removeBot: (botId: string) => void;
  selectBot: (botId: string | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;

  // Socket actions
  createBot: (ign: string, token: string) => void;
  deleteBot: (botId: string) => void;
  sendCommand: (botId: string, command: BotCommand) => void;
  initSocket: () => void;
}

export const useBotStore = create<BotStore>((set, get) => ({
  bots: new Map(),
  selectedBotId: null,
  chatMessages: [],
  isConnected: false,
  error: null,

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

  setError: (error) => set({ error }),

  createBot: (ign, token) => {
    socketCreateBot(ign, token);
  },

  deleteBot: (botId) => {
    socketRemoveBot(botId);
  },

  sendCommand: (botId, command) => {
    socketSendCommand(botId, command);
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
      set({ error: `Bot ${data.botId}: ${data.error}` });
    });

    socket.on("chat_message", (message: ChatMessage) => {
      get().addChatMessage(message);
    });

    socket.on("error", (data: { message: string }) => {
      set({ error: data.message });
    });
  },
}));
