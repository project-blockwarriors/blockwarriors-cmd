"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatCoords } from "@/lib/utils";
import type { BotState } from "@/types/bot";
import {
  Heart,
  MapPin,
  Activity,
  Trash2,
  Package,
  Utensils,
} from "lucide-react";

interface BotCardProps {
  bot: BotState;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const statusColors = {
  connecting: "bg-status-busy",
  online: "bg-status-online",
  offline: "bg-status-offline",
  error: "bg-status-error",
};

const statusLabels = {
  connecting: "Connecting",
  online: "Online",
  offline: "Offline",
  error: "Error",
};

export function BotCard({ bot, isSelected, onSelect, onDelete }: BotCardProps) {
  const healthPercent = bot.health ? (bot.health.health / 20) * 100 : 0;
  const foodPercent = bot.health ? (bot.health.food / 20) * 100 : 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-princeton/50",
        isSelected && "border-princeton glow-orange"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                statusColors[bot.status],
                bot.status === "online" && "animate-pulse"
              )}
            />
            <CardTitle className="text-lg">{bot.ign}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {statusLabels[bot.status]}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">Health</span>
            <span className="ml-auto font-mono">
              {bot.health ? `${bot.health.health.toFixed(1)}/20` : "-"}
            </span>
          </div>
          <Progress
            value={healthPercent}
            className="h-2"
            indicatorClassName="bg-red-500"
          />
        </div>

        {/* Food Bar */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Utensils className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Food</span>
            <span className="ml-auto font-mono">
              {bot.health ? `${bot.health.food}/20` : "-"}
            </span>
          </div>
          <Progress
            value={foodPercent}
            className="h-2"
            indicatorClassName="bg-amber-500"
          />
        </div>

        {/* Position */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-minecraft-grass" />
          <span className="text-muted-foreground">Position</span>
          <span className="ml-auto font-mono text-xs">
            {bot.position
              ? formatCoords(bot.position.x, bot.position.y, bot.position.z)
              : "-"}
          </span>
        </div>

        {/* Current Action */}
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-princeton" />
          <span className="text-muted-foreground">Action</span>
          <span className="ml-auto text-xs truncate max-w-[120px]">
            {bot.currentAction}
          </span>
        </div>

        {/* Inventory Count */}
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-blue-400" />
          <span className="text-muted-foreground">Inventory</span>
          <span className="ml-auto font-mono">
            {bot.inventory.length} items
          </span>
        </div>

        {/* Error Message */}
        {bot.errorMessage && (
          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
            {bot.errorMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
