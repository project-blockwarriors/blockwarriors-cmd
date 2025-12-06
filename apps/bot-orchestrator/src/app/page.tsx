"use client";

import { useEffect } from "react";
import { useBotStore } from "@/lib/store";
import { BotCard } from "@/components/bot/BotCard";
import { Minimap } from "@/components/bot/Minimap";
import { BotControls } from "@/components/bot/BotControls";
import { CreateBotModal } from "@/components/bot/CreateBotModal";
import { ChatPanel } from "@/components/bot/ChatPanel";
import { EntityPanel } from "@/components/bot/EntityPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Wifi, WifiOff, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const {
    bots,
    selectedBotId,
    chatMessages,
    isConnected,
    error,
    selectBot,
    createBot,
    deleteBot,
    sendCommand,
    initSocket,
    setError,
  } = useBotStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  const botArray = Array.from(bots.values());
  const selectedBot = selectedBotId ? bots.get(selectedBotId) || null : null;
  const botNameMap = new Map(botArray.map((b) => [b.id, b.ign]));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-princeton/10 rounded-lg">
              <Bot className="h-6 w-6 text-princeton" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Bot Orchestrator</h1>
              <p className="text-xs text-muted-foreground">
                BlockWarriors Debug Tool
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-status-online" />
                  <span className="text-status-online">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-status-offline" />
                  <span className="text-status-offline">Disconnected</span>
                </>
              )}
            </div>

            {/* Bot Count */}
            <div className="text-sm text-muted-foreground">
              {botArray.length} bot{botArray.length !== 1 ? "s" : ""} active
            </div>

            {/* Create Bot Button */}
            <CreateBotModal onCreateBot={createBot} />
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
          <div className="container mx-auto flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button
              className="ml-auto hover:underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Panel - Bot List */}
          <div className="col-span-3 h-full flex flex-col">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              Bots
            </h2>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {botArray.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No bots yet</p>
                    <p className="text-sm">
                      Click "Add Bot" to create one
                    </p>
                  </div>
                ) : (
                  botArray.map((bot) => (
                    <BotCard
                      key={bot.id}
                      bot={bot}
                      isSelected={bot.id === selectedBotId}
                      onSelect={() => selectBot(bot.id)}
                      onDelete={() => deleteBot(bot.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center Panel - Minimap */}
          <div className="col-span-5 h-full">
            <Minimap
              bots={botArray}
              selectedBotId={selectedBotId}
              onSelectBot={selectBot}
              onCommand={(botId, cmd) => sendCommand(botId, cmd)}
            />
          </div>

          {/* Right Panel - Controls, Entities & Chat */}
          <div className="col-span-4 h-full flex flex-col gap-3">
            <div className="flex-1 min-h-0">
              <BotControls
                bot={selectedBot}
                onCommand={(cmd) => {
                  if (selectedBotId) {
                    sendCommand(selectedBotId, cmd);
                  }
                }}
              />
            </div>
            {selectedBot && (
              <div className="h-48">
                <EntityPanel
                  entities={selectedBot.nearbyEntities || []}
                  onAttack={(entityId) => {
                    sendCommand(selectedBotId!, {
                      type: "attack_entity",
                      payload: { entityId }
                    });
                  }}
                />
              </div>
            )}
            <div className="h-48">
              <ChatPanel messages={chatMessages} botNames={botNameMap} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-3">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Bot Orchestrator v1.0.0 | Server: mcpanel.blockwarriors.ai:25565
        </div>
      </footer>
    </div>
  );
}
