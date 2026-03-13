"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NearbyEntity, BotCommand } from "@/types/bot";
import { Swords, User, Skull, MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityPanelProps {
  entities: NearbyEntity[];
  onAttack: (entityId: number) => void;
}

export function EntityPanel({ entities, onAttack }: EntityPanelProps) {
  if (entities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="h-4 w-4 text-princeton" />
            Nearby Entities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            No entities nearby
          </div>
        </CardContent>
      </Card>
    );
  }

  const players = entities.filter((e) => e.isPlayer);
  const hostiles = entities.filter((e) => e.isHostile);
  const others = entities.filter((e) => !e.isPlayer && !e.isHostile);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Swords className="h-4 w-4 text-princeton" />
          Nearby Entities
          <span className="text-sm font-normal text-muted-foreground">
            ({entities.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-2">
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-2">
            {/* Players Section */}
            {players.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-[#00BFFF] flex items-center gap-1">
                  <User className="h-3 w-3" /> Players ({players.length})
                </h4>
                <div className="space-y-1">
                  {players.map((entity) => (
                    <EntityRow
                      key={entity.id}
                      entity={entity}
                      onAttack={onAttack}
                      colorClass="border-[#00BFFF]/30 hover:border-[#00BFFF]"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hostile Section */}
            {hostiles.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-[#FF4444] flex items-center gap-1">
                  <Skull className="h-3 w-3" /> Hostile ({hostiles.length})
                </h4>
                <div className="space-y-1">
                  {hostiles.map((entity) => (
                    <EntityRow
                      key={entity.id}
                      entity={entity}
                      onAttack={onAttack}
                      colorClass="border-[#FF4444]/30 hover:border-[#FF4444]"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Entities Section */}
            {others.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Other ({others.length})
                </h4>
                <div className="space-y-1">
                  {others.map((entity) => (
                    <EntityRow
                      key={entity.id}
                      entity={entity}
                      onAttack={onAttack}
                      colorClass="border-border hover:border-muted-foreground"
                    />
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

interface EntityRowProps {
  entity: NearbyEntity;
  onAttack: (entityId: number) => void;
  colorClass: string;
}

function EntityRow({ entity, onAttack, colorClass }: EntityRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded border bg-card/50 transition-colors",
        colorClass
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{entity.displayName}</div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {entity.distance}m
          </span>
          {entity.health !== undefined && (
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              {entity.health.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onAttack(entity.id)}
      >
        <Swords className="h-4 w-4" />
      </Button>
    </div>
  );
}
