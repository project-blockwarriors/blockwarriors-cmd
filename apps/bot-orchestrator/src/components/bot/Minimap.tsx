"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BotState, BotCommand } from "@/types/bot";
import { ZoomIn, ZoomOut, Maximize2, Target, Move, MousePointer } from "lucide-react";

interface MinimapProps {
  bots: BotState[];
  selectedBotId: string | null;
  onSelectBot: (id: string) => void;
  onCommand?: (botId: string, command: BotCommand) => void;
}

const BOT_COLORS = [
  "#FF6B00", // Princeton Orange
  "#7CBD00", // Minecraft Grass
  "#3F76E4", // Water Blue
  "#FF4500", // Lava Orange
  "#9B59B6", // Purple
  "#E91E63", // Pink
  "#00BCD4", // Cyan
  "#FFEB3B", // Yellow
];

export function Minimap({ bots, selectedBotId, onSelectBot, onCommand }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, z: 0 });
  const [moveMode, setMoveMode] = useState(false);
  const [waypoint, setWaypoint] = useState<{ x: number; z: number } | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<number | null>(null);
  const didDragRef = useRef(false);

  // Get canvas coordinates accounting for CSS scaling
  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    // Scale from display size to canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    return { x: canvasX, y: canvasY };
  }, []);

  // Calculate center based on all bots or default to world spawn
  const getCenter = () => {
    if (bots.length === 0) return { x: 0, z: 0 };

    const positions = bots
      .filter((b) => b.position)
      .map((b) => ({ x: b.position!.x, z: b.position!.z }));

    if (positions.length === 0) return { x: 0, z: 0 };

    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const avgZ = positions.reduce((sum, p) => sum + p.z, 0) / positions.length;

    return { x: avgX, z: avgZ };
  };

  const centerOnBots = () => {
    const center = getCenter();
    setOffset({ x: -center.x, z: -center.z });
  };

  const centerOnSelected = () => {
    const selected = bots.find((b) => b.id === selectedBotId);
    if (selected?.position) {
      setOffset({ x: -selected.position.x, z: -selected.position.z });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    const gridSize = 16 * scale;

    for (let x = (offset.x * scale + centerX) % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = (offset.z * scale + centerY) % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axis lines
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;

    // X axis (red tint)
    const axisY = centerY + offset.z * scale;
    if (axisY >= 0 && axisY <= height) {
      ctx.strokeStyle = "rgba(255, 100, 100, 0.3)";
      ctx.beginPath();
      ctx.moveTo(0, axisY);
      ctx.lineTo(width, axisY);
      ctx.stroke();
    }

    // Z axis (blue tint)
    const axisX = centerX + offset.x * scale;
    if (axisX >= 0 && axisX <= width) {
      ctx.strokeStyle = "rgba(100, 100, 255, 0.3)";
      ctx.beginPath();
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, height);
      ctx.stroke();
    }

    // Draw bots
    bots.forEach((bot, index) => {
      if (!bot.position) return;

      const screenX = centerX + (bot.position.x + offset.x) * scale;
      const screenZ = centerY + (bot.position.z + offset.z) * scale;

      // Skip if off screen
      if (screenX < -20 || screenX > width + 20 || screenZ < -20 || screenZ > height + 20) {
        return;
      }

      const isSelected = bot.id === selectedBotId;
      const color = BOT_COLORS[index % BOT_COLORS.length];

      // Draw bot direction indicator
      const yaw = bot.position.yaw || 0;
      const dirLength = isSelected ? 20 : 15;
      const endX = screenX + Math.sin(yaw) * dirLength;
      const endZ = screenZ - Math.cos(yaw) * dirLength;

      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(screenX, screenZ);
      ctx.lineTo(endX, endZ);
      ctx.stroke();

      // Draw bot marker
      const radius = isSelected ? 8 : 6;

      // Glow effect for selected
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenZ, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Draw border
      ctx.strokeStyle = isSelected ? "#fff" : "rgba(255,255,255,0.5)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.arc(screenX, screenZ, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw IGN label
      ctx.fillStyle = "#fff";
      ctx.font = `${isSelected ? "bold " : ""}10px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(bot.ign, screenX, screenZ - radius - 5);

      // Draw coordinates for selected bot
      if (isSelected) {
        ctx.font = "9px monospace";
        ctx.fillStyle = "#999";
        ctx.fillText(
          `${Math.floor(bot.position.x)}, ${Math.floor(bot.position.z)}`,
          screenX,
          screenZ + radius + 12
        );
      }
    });

    // Draw nearby entities for selected bot
    const selectedBot = bots.find((b) => b.id === selectedBotId);
    if (selectedBot?.nearbyEntities) {
      selectedBot.nearbyEntities.forEach((entity) => {
        const screenX = centerX + (entity.position.x + offset.x) * scale;
        const screenZ = centerY + (entity.position.z + offset.z) * scale;

        // Skip if off screen
        if (screenX < -10 || screenX > width + 10 || screenZ < -10 || screenZ > height + 10) {
          return;
        }

        // Different colors for different entity types
        let entityColor = "#888"; // Default gray
        if (entity.isPlayer) {
          entityColor = "#00BFFF"; // Cyan for players
        } else if (entity.isHostile) {
          entityColor = "#FF4444"; // Red for hostile
        }

        // Draw entity marker (smaller than bots)
        ctx.fillStyle = entityColor;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(screenX, screenZ, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw entity name on hover area
        ctx.fillStyle = entityColor;
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(entity.displayName.slice(0, 10), screenX, screenZ - 6);
      });
    }

    // Draw waypoint if set
    if (waypoint) {
      const wpScreenX = centerX + (waypoint.x + offset.x) * scale;
      const wpScreenZ = centerY + (waypoint.z + offset.z) * scale;

      // Pulsing waypoint marker
      ctx.strokeStyle = "#FF6B00";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(wpScreenX, wpScreenZ, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cross marker
      ctx.beginPath();
      ctx.moveTo(wpScreenX - 6, wpScreenZ);
      ctx.lineTo(wpScreenX + 6, wpScreenZ);
      ctx.moveTo(wpScreenX, wpScreenZ - 6);
      ctx.lineTo(wpScreenX, wpScreenZ + 6);
      ctx.stroke();

      // Coordinates
      ctx.fillStyle = "#FF6B00";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.floor(waypoint.x)}, ${Math.floor(waypoint.z)}`, wpScreenX, wpScreenZ + 18);
    }

    // Draw scale indicator and mode
    ctx.fillStyle = "#666";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Scale: ${scale.toFixed(1)}x`, 10, height - 10);

    if (moveMode && selectedBotId) {
      ctx.fillStyle = "#FF6B00";
      ctx.fillText("Click to move bot", 10, height - 24);
    }

  }, [bots, selectedBotId, scale, offset, waypoint, moveMode]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.1, Math.min(10, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, z: e.clientY });
    didDragRef.current = false; // Reset drag flag
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle dragging
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dz = (e.clientY - dragStart.z) / scale;

      // If we moved more than a small threshold, mark as dragged
      const distMoved = Math.abs(dx) + Math.abs(dz);
      if (distMoved > 0.5) {
        didDragRef.current = true;
      }

      setOffset((prev) => ({ x: prev.x + dx, z: prev.z + dz }));
      setDragStart({ x: e.clientX, z: e.clientY });
      return;
    }

    // Check for entity hover
    const coords = getCanvasCoords(e);
    if (coords) {
      const entity = getEntityAtPosition(coords.x, coords.y);
      setHoveredEntity(entity?.id ?? null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const screenToWorld = useCallback((canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const worldX = (canvasX - centerX) / scale - offset.x;
    const worldZ = (canvasY - centerY) / scale - offset.z;

    return { x: worldX, z: worldZ };
  }, [scale, offset]);

  // Check if mouse is over an entity
  const getEntityAtPosition = useCallback((canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const selectedBot = bots.find((b) => b.id === selectedBotId);
    if (!selectedBot?.nearbyEntities) return null;

    for (const entity of selectedBot.nearbyEntities) {
      const screenX = centerX + (entity.position.x + offset.x) * scale;
      const screenZ = centerY + (entity.position.z + offset.z) * scale;
      const distance = Math.sqrt(
        Math.pow(canvasX - screenX, 2) + Math.pow(canvasY - screenZ, 2)
      );

      if (distance < 10) {
        return entity;
      }
    }
    return null;
  }, [bots, selectedBotId, offset, scale]);

  const handleClick = (e: React.MouseEvent) => {
    // Don't process clicks after drag operations
    if (didDragRef.current) {
      didDragRef.current = false; // Reset for next interaction
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const { x: clickX, y: clickY } = coords;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // If in move mode and we have a selected bot, move it
    if (moveMode && selectedBotId && onCommand) {
      const worldPos = screenToWorld(clickX, clickY);
      if (worldPos) {
        const selectedBot = bots.find((b) => b.id === selectedBotId);
        const y = selectedBot?.position?.y || 64;

        setWaypoint({ x: worldPos.x, z: worldPos.z });
        onCommand(selectedBotId, {
          type: "goto",
          payload: { x: worldPos.x, y, z: worldPos.z }
        });

        // Clear waypoint after 3 seconds
        setTimeout(() => setWaypoint(null), 3000);
      }
      return;
    }

    // Find clicked bot
    for (const bot of bots) {
      if (!bot.position) continue;

      const screenX = centerX + (bot.position.x + offset.x) * scale;
      const screenZ = centerY + (bot.position.z + offset.z) * scale;
      const distance = Math.sqrt(
        Math.pow(clickX - screenX, 2) + Math.pow(clickY - screenZ, 2)
      );

      if (distance < 15) {
        onSelectBot(bot.id);
        return;
      }
    }

    // Check if clicked on an entity (for attack)
    const entity = getEntityAtPosition(clickX, clickY);
    if (entity && onCommand && selectedBotId) {
      onCommand(selectedBotId, {
        type: "attack_entity",
        payload: { entityId: entity.id }
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!selectedBotId || !onCommand) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const worldPos = screenToWorld(coords.x, coords.y);
    if (worldPos) {
      const selectedBot = bots.find((b) => b.id === selectedBotId);
      const y = selectedBot?.position?.y || 64;

      setWaypoint({ x: worldPos.x, z: worldPos.z });
      onCommand(selectedBotId, {
        type: "goto",
        payload: { x: worldPos.x, y, z: worldPos.z }
      });

      // Clear waypoint after 3 seconds
      setTimeout(() => setWaypoint(null), 3000);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">World Map</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setScale((s) => Math.min(10, s * 1.2))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setScale((s) => Math.max(0.1, s * 0.8))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={centerOnBots}
              title="Center on all bots"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            {selectedBotId && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={centerOnSelected}
                  title="Center on selected"
                >
                  <Target className="h-4 w-4" />
                </Button>
                <Button
                  variant={moveMode ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMoveMode(!moveMode)}
                  title={moveMode ? "Exit move mode" : "Enter move mode (click to move)"}
                >
                  {moveMode ? <MousePointer className="h-4 w-4" /> : <Move className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 min-h-0 overflow-hidden">
        <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-border">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className={`w-full h-full minimap-container ${
              hoveredEntity !== null
                ? "cursor-pointer"
                : moveMode
                  ? "cursor-crosshair"
                  : "cursor-grab active:cursor-grabbing"
            }`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              setHoveredEntity(null);
            }}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
          />
          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-background/80 rounded px-2 py-1 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{bots.length} bots</span>
            </div>
            {selectedBotId && (
              <div className="text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00BFFF]" /> Players
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF4444]" /> Hostile
                </div>
                <div className="text-[10px] mt-1">Right-click: Move bot</div>
                <div className="text-[10px]">Click entity: Attack</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
