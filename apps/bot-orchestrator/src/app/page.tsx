"use client";

import { useEffect } from "react";
import { useBotStore } from "@/lib/store";
import { BotCard } from "@/components/bot/BotCard";
import { Minimap } from "@/components/bot/Minimap";
import { BotControls } from "@/components/bot/BotControls";
import { CreateBotModal } from "@/components/bot/CreateBotModal";
import { ServerSettingsModal } from "@/components/bot/ServerSettingsModal";
import { ChatPanel } from "@/components/bot/ChatPanel";
import { EntityPanel } from "@/components/bot/EntityPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Wifi, WifiOff, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const {
    bots,
    selectedBotId,
    chatMessages,
    isConnected,
    error,
    serverConfig,
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

            <div className="text-sm text-muted-foreground">
              {botArray.length} bot{botArray.length !== 1 ? "s" : ""} active
            </div>

            <ServerSettingsModal />

            <CreateBotModal onCreateBot={createBot} />
          </div>
        </div>
      </header>

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

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)]">
          {/* Left sidebar: Compact bot list */}
          <div className="lg:w-56 flex flex-col shrink-0">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2 shrink-0">
              <Bot className="h-5 w-5 text-muted-foreground" />
              Bots
            </h2>
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2">
                {botArray.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No bots</p>
                  </div>
                ) : (
                  botArray.map((bot) => (
                    <div
                      key={bot.id}
                      className={cn(
                        "relative w-full p-3 rounded-lg border transition-all group cursor-pointer",
                        bot.id === selectedBotId
                          ? "border-princeton bg-princeton/10"
                          : "border-border bg-card hover:border-princeton/50"
                      )}
                      onClick={() => selectBot(bot.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              bot.status === "online" && "bg-status-online animate-pulse",
                              bot.status === "connecting" && "bg-status-busy",
                              bot.status === "offline" && "bg-status-offline",
                              bot.status === "error" && "bg-status-error"
                            )}
                          />
                          <span className="font-medium text-sm">{bot.ign}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBot(bot.id);
                          }}
                          className="p-1 hover:bg-destructive/20 rounded transition-colors"
                          aria-label={`Delete ${bot.ign}`}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                      {bot.health && (
                        <div className="flex gap-2 text-xs">
                          <span className="text-red-500">❤ {bot.health.health.toFixed(0)}</span>
                          <span className="text-amber-500">🍖 {bot.health.food}</span>
                        </div>
                      )}
                      {bot.errorMessage && (
                        <div className="text-xs text-destructive mt-1 truncate">
                          {bot.errorMessage}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center: Minimap takes priority */}
          <div className="flex-1 min-h-[400px] lg:min-h-0">
            <Minimap
              bots={botArray}
              selectedBotId={selectedBotId}
              onSelectBot={selectBot}
              onCommand={(botId, cmd) => sendCommand(botId, cmd)}
            />
          </div>

          {/* Right sidebar: Controls and panels */}
          <div className="lg:w-80 flex flex-col gap-3 shrink-0">
            <div className="flex-1 min-h-[300px] lg:min-h-0">
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
              <div className="h-48 shrink-0">
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
            <div className="h-48 shrink-0">
              <ChatPanel messages={chatMessages} botNames={botNameMap} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/30 py-3">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Bot Orchestrator v1.0.0 | Server: {serverConfig.host}:{serverConfig.port}
        </div>
      </footer>
    </div>
  );
}
