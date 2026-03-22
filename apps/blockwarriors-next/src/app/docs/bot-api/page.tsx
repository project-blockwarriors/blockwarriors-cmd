'use client';

import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function BotApiPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Bot API Reference</h1>
      <p className="text-gray-400 mb-8">
        Complete reference for writing bot strategies. Your bot receives a{' '}
        <code className="text-princeton-orange">BotAPI</code> object with
        methods to control movement, combat, and read game state.
      </p>

      {/* Strategy Interface */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">
          Strategy Interface
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Your bot is defined as a <code className="text-princeton-orange">Strategy</code> object
          with lifecycle callbacks. Only <code className="text-princeton-orange">onSpawn</code> and{' '}
          <code className="text-princeton-orange">onTick</code> are required.
        </p>
        <CodeBlock
          filename="Strategy"
          code={`interface Strategy {
  // Called once when your bot spawns in the world
  onSpawn(bot: BotAPI): void;

  // Called every 500ms while the match is active
  onTick(bot: BotAPI, state: GameState): void;

  // Called when your bot dies (optional)
  onDeath?(bot: BotAPI): void;

  // Called when your bot takes damage (optional)
  onDamage?(bot: BotAPI, attacker?: EntityInfo): void;

  // Called when a chat message is received (optional)
  onChat?(bot: BotAPI, sender: string, message: string): void;
}`}
        />
      </section>

      {/* BotAPI Methods */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          BotAPI Methods
        </h2>

        <Accordion type="multiple" className="space-y-2">
          {/* Movement */}
          <AccordionItem
            value="movement"
            className="border border-[#333] rounded-lg bg-[#111] px-4"
          >
            <AccordionTrigger className="text-white hover:no-underline">
              <div className="flex items-center gap-2">
                Movement
                <Badge
                  variant="outline"
                  className="border-[#444] text-gray-500 text-[10px]"
                >
                  7 methods
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-4 pt-2">
              <Method
                name="goto(x, y, z)"
                description="Navigate to coordinates using pathfinding. Non-blocking — starts movement and returns immediately."
                params={[
                  { name: 'x', type: 'number', desc: 'X coordinate' },
                  { name: 'y', type: 'number', desc: 'Y coordinate' },
                  { name: 'z', type: 'number', desc: 'Z coordinate' },
                ]}
              />
              <Method
                name="follow(playerName)"
                description="Continuously follow a player by name."
                params={[
                  {
                    name: 'playerName',
                    type: 'string',
                    desc: 'In-game name of the player to follow',
                  },
                ]}
              />
              <Method
                name="stop()"
                description="Stop all current movement and pathfinding."
              />
              <Method
                name="jump()"
                description="Make the bot jump once."
              />
              <Method
                name="sprint(enabled)"
                description="Toggle sprinting on or off."
                params={[
                  { name: 'enabled', type: 'boolean', desc: 'Whether to sprint' },
                ]}
              />
              <Method
                name="sneak(enabled)"
                description="Toggle sneaking on or off."
                params={[
                  { name: 'enabled', type: 'boolean', desc: 'Whether to sneak' },
                ]}
              />
              <Method
                name="look(yaw, pitch)"
                description="Set the bot's head rotation."
                params={[
                  { name: 'yaw', type: 'number', desc: 'Horizontal angle (degrees)' },
                  { name: 'pitch', type: 'number', desc: 'Vertical angle (degrees)' },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Combat */}
          <AccordionItem
            value="combat"
            className="border border-[#333] rounded-lg bg-[#111] px-4"
          >
            <AccordionTrigger className="text-white hover:no-underline">
              <div className="flex items-center gap-2">
                Combat
                <Badge
                  variant="outline"
                  className="border-[#444] text-gray-500 text-[10px]"
                >
                  2 methods
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-4 pt-2">
              <Method
                name="attack()"
                description="Swing the currently held item. Hits the nearest entity in range."
              />
              <Method
                name="attackEntity(entityId)"
                description="Attack a specific entity by ID."
                params={[
                  { name: 'entityId', type: 'number', desc: 'Entity ID from nearbyEntities' },
                ]}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Communication */}
          <AccordionItem
            value="communication"
            className="border border-[#333] rounded-lg bg-[#111] px-4"
          >
            <AccordionTrigger className="text-white hover:no-underline">
              <div className="flex items-center gap-2">
                Communication
                <Badge
                  variant="outline"
                  className="border-[#444] text-gray-500 text-[10px]"
                >
                  1 method
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-4 pt-2">
              <Method
                name="chat(message)"
                description="Send a chat message. Used for /login and team communication."
                params={[
                  { name: 'message', type: 'string', desc: 'Message to send' },
                ]}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* State Properties */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          State Properties
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          These read-only properties are available on the{' '}
          <code className="text-princeton-orange">BotAPI</code> object:
        </p>

        <div className="space-y-3">
          <Property
            name="position"
            type="Vec3"
            description="Bot's current position { x, y, z }"
          />
          <Property
            name="health"
            type="number"
            description="Current health (0-20, where 20 = 10 hearts)"
          />
          <Property
            name="food"
            type="number"
            description="Current food level (0-20)"
          />
          <Property
            name="inventory"
            type="Item[]"
            description="Array of items in the bot's inventory"
          />
          <Property
            name="nearbyEntities"
            type="EntityInfo[]"
            description="All entities within render distance"
          />
          <Property
            name="nearbyPlayers"
            type="EntityInfo[]"
            description="All players within render distance (both teams)"
          />
          <Property
            name="nearbyEnemies"
            type="EntityInfo[]"
            description="Enemy team players within render distance"
          />
        </div>
      </section>

      {/* Types */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">Types</h2>
        <CodeBlock
          filename="Types"
          code={`interface Vec3 {
  x: number;
  y: number;
  z: number;
  distanceTo(other: Vec3): number;
}

interface EntityInfo {
  id: number;
  name: string;
  type: string;         // "player", "mob", etc.
  position: Vec3;
  health?: number;
}

interface GameState {
  matchId: string;
  gameType: string;     // "pvp", "bridge", "ctf"
  state: string;        // "countdown", "in_progress", "finished"
  durationMs: number;   // Time elapsed since match start
}

interface Item {
  name: string;
  count: number;
  slot: number;
}`}
        />
      </section>

      {/* Tips */}
      <section className="p-4 rounded-lg border border-[#333] bg-[#111]">
        <h3 className="text-sm font-medium text-white mb-2">Tips</h3>
        <ul className="text-sm text-gray-500 space-y-1.5">
          <li>
            <code className="text-princeton-orange">onTick</code> runs every
            500ms — keep it fast. Avoid blocking operations.
          </li>
          <li>
            Use <code className="text-princeton-orange">nearbyEnemies</code>{' '}
            instead of filtering <code className="text-princeton-orange">nearbyPlayers</code>{' '}
            yourself — it already excludes teammates.
          </li>
          <li>
            <code className="text-princeton-orange">goto()</code> is
            non-blocking. Check <code className="text-princeton-orange">position</code>{' '}
            on the next tick to see if you&apos;ve arrived.
          </li>
        </ul>
      </section>
    </div>
  );
}

function Method({
  name,
  description,
  params,
}: {
  name: string;
  description: string;
  params?: { name: string; type: string; desc: string }[];
}) {
  return (
    <div className="border-l-2 border-[#333] pl-3">
      <code className="text-princeton-orange text-sm font-mono">{name}</code>
      <p className="text-gray-400 mt-1">{description}</p>
      {params && params.length > 0 && (
        <div className="mt-2 space-y-1">
          {params.map((p) => (
            <div key={p.name} className="text-xs text-gray-500">
              <code className="text-gray-300">{p.name}</code>
              <span className="text-gray-600">: {p.type}</span> — {p.desc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Property({
  name,
  type,
  description,
}: {
  name: string;
  type: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#111] border border-[#222]">
      <code className="text-princeton-orange text-sm font-mono shrink-0">
        .{name}
      </code>
      <div className="flex-1 min-w-0">
        <Badge
          variant="outline"
          className="border-[#444] text-gray-500 text-[10px] mb-1"
        >
          {type}
        </Badge>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
