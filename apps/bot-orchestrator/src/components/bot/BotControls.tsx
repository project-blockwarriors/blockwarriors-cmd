"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BotState, BotCommand } from "@/types/bot";
import {
  Send,
  StopCircle,
  Navigation,
  UserPlus,
  MessageSquare,
  Space,
  Eye,
  Swords,
  Footprints,
} from "lucide-react";

interface BotControlsProps {
  bot: BotState | null;
  onCommand: (command: BotCommand) => void;
}

export function BotControls({ bot, onCommand }: BotControlsProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [gotoCoords, setGotoCoords] = useState({ x: "", y: "", z: "" });
  const [followPlayer, setFollowPlayer] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [isSneaking, setIsSneaking] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  if (!bot) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Bot Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Select a bot to control
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleChat = () => {
    if (!chatMessage.trim()) return;
    onCommand({ type: "chat", payload: { message: chatMessage } });
    setChatMessage("");
  };

  const handleGoto = () => {
    const x = parseFloat(gotoCoords.x);
    const y = parseFloat(gotoCoords.y);
    const z = parseFloat(gotoCoords.z);
    if (isNaN(x) || isNaN(y) || isNaN(z)) return;
    onCommand({ type: "goto", payload: { x, y, z } });
  };

  const handleFollow = () => {
    if (!followPlayer.trim()) return;
    onCommand({ type: "follow", payload: { player: followPlayer } });
    setFollowPlayer("");
  };

  const handleCustom = () => {
    if (!customCommand.trim()) return;
    onCommand({ type: "custom", payload: { command: customCommand } });
    setCustomCommand("");
  };

  const toggleSneak = () => {
    const newState = !isSneaking;
    setIsSneaking(newState);
    onCommand({ type: "sneak", payload: { enabled: newState } });
  };

  const toggleSprint = () => {
    const newState = !isSprinting;
    setIsSprinting(newState);
    onCommand({ type: "sprint", payload: { enabled: newState } });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Controls
          <span className="text-sm font-normal text-princeton">
            {bot.ign}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommand({ type: "stop" })}
                  className="flex items-center gap-1"
                >
                  <StopCircle className="h-3 w-3" />
                  Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommand({ type: "jump" })}
                  className="flex items-center gap-1"
                >
                  <Space className="h-3 w-3" />
                  Jump
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCommand({ type: "attack" })}
                  className="flex items-center gap-1"
                >
                  <Swords className="h-3 w-3" />
                  Attack
                </Button>
                <Button
                  variant={isSneaking ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSneak}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Sneak
                </Button>
                <Button
                  variant={isSprinting ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSprint}
                  className="flex items-center gap-1"
                >
                  <Footprints className="h-3 w-3" />
                  Sprint
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Navigate To
              </h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="X"
                  value={gotoCoords.x}
                  onChange={(e) =>
                    setGotoCoords({ ...gotoCoords, x: e.target.value })
                  }
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Y"
                  value={gotoCoords.y}
                  onChange={(e) =>
                    setGotoCoords({ ...gotoCoords, y: e.target.value })
                  }
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Z"
                  value={gotoCoords.z}
                  onChange={(e) =>
                    setGotoCoords({ ...gotoCoords, z: e.target.value })
                  }
                  className="w-20"
                />
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleGoto}
                  className="shrink-0"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Follow Player */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Follow Player
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Player name"
                  value={followPlayer}
                  onChange={(e) => setFollowPlayer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFollow()}
                />
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleFollow}
                  className="shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Send Chat
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                />
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleChat}
                  className="shrink-0"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Custom Command */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Custom Command
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="/command args..."
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustom()}
                  className="font-mono text-sm"
                />
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleCustom}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Inventory Preview */}
            {bot.inventory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Inventory ({bot.inventory.length} items)
                </h4>
                <div className="grid grid-cols-4 gap-1 p-2 bg-secondary/50 rounded-md">
                  {bot.inventory.slice(0, 16).map((item, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-background rounded p-1 text-[8px] text-center flex flex-col items-center justify-center"
                      title={`${item.name} x${item.count}`}
                    >
                      <span className="truncate w-full">{item.name.replace("minecraft:", "")}</span>
                      <span className="text-muted-foreground">x{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
