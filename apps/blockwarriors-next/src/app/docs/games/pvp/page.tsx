'use client';

import { CodeBlock } from '../../components/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Swords, Info } from 'lucide-react';

export default function PvPPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Swords className="w-6 h-6 text-princeton-orange" />
        <h1 className="text-3xl font-bold text-white">PvP</h1>
        <Badge
          variant="outline"
          className="border-[#444] text-gray-500 text-xs"
        >
          1v1
        </Badge>
      </div>
      <p className="text-gray-400 mb-8">
        Classic 1v1 combat. Two players fight until one is eliminated.
      </p>

      {/* Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Rules</h2>
        <div className="space-y-3 text-sm">
          <Rule label="Players" value="1 per team (2 total)" />
          <Rule label="Win condition" value="Kill the opponent" />
          <Rule label="Respawns" value="None — single elimination" />
          <Rule label="Disconnect" value="Instant forfeit. Opponent wins immediately." />
          <Rule label="Countdown" value="5-second countdown before combat begins" />
        </div>
      </section>

      {/* Loadout */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Loadout</h2>
        <p className="text-gray-400 text-sm mb-3">
          Both players spawn with the same equipment:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <LoadoutItem name="Stone Sword" quantity="1" />
          <LoadoutItem name="Health" quantity="20 (10 hearts)" />
          <LoadoutItem name="Food" quantity="20 (full)" />
        </div>
        <Alert className="bg-[#111] border-[#333] mt-4">
          <Info className="h-4 w-4 text-princeton-orange" />
          <AlertTitle className="text-white text-sm">
            No armor
          </AlertTitle>
          <AlertDescription className="text-gray-500 text-sm">
            Players spawn without armor. Fights are fast — typically under 30
            seconds.
          </AlertDescription>
        </Alert>
      </section>

      {/* Arena */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Arena</h2>
        <p className="text-gray-400 text-sm">
          A flat world. Blue team spawns at{' '}
          <code className="text-princeton-orange">(10, 65, 0)</code> facing
          west, red team at{' '}
          <code className="text-princeton-orange">(-10, 65, 0)</code> facing
          east. During the 5-second countdown, players are frozen in place
          with Slowness and Jump Boost effects.
        </p>
      </section>

      {/* Strategy tips */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Strategy Tips</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Sprint-hit:</strong> Sprinting
              before attacking deals knockback. Use{' '}
              <code className="text-princeton-orange">bot.sprint(true)</code>{' '}
              when approaching, then attack.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Attack cooldown:</strong> Minecraft
              has a 0.625s attack cooldown with a stone sword. Attacking too
              fast deals reduced damage.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Track enemy health:</strong> Use{' '}
              <code className="text-princeton-orange">
                bot.nearbyEnemies[0].health
              </code>{' '}
              to decide whether to play aggressive or defensive.
            </span>
          </li>
        </ul>
      </section>

      {/* Example bot */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">Example Bot</h2>
        <CodeBlock
          filename="pvp-bot.ts"
          code={`import { Strategy, BotAPI, GameState } from '@blockwarriors/sdk';

export const pvpStrategy: Strategy = {
  onSpawn(bot) {
    console.log('PvP bot ready!');
  },

  onTick(bot, state) {
    const enemy = bot.nearbyEnemies[0];
    if (!enemy) return;

    const dist = bot.position.distanceTo(enemy.position);

    if (dist > 3.5) {
      // Chase the enemy
      bot.sprint(true);
      bot.goto(enemy.position.x, enemy.position.y, enemy.position.z);
    } else {
      // In attack range
      bot.sprint(false);
      bot.attack();
    }
  },

  onDeath(bot) {
    console.log('Defeated! GG');
  },
};`}
        />
      </section>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#111] border border-[#222]">
      <span className="text-gray-500 text-sm w-28 shrink-0">{label}</span>
      <span className="text-gray-300 text-sm">{value}</span>
    </div>
  );
}

function LoadoutItem({
  name,
  quantity,
}: {
  name: string;
  quantity: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-center">
      <p className="text-white text-sm font-medium">{name}</p>
      <p className="text-gray-500 text-xs mt-1">{quantity}</p>
    </div>
  );
}
