'use client';

import { CodeBlock } from '../../components/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Swords, Info } from 'lucide-react';

export default function BuildUHCPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Swords className="w-6 h-6 text-princeton-orange" />
        <h1 className="text-3xl font-bold text-white">Build UHC</h1>
        <Badge
          variant="outline"
          className="border-[#444] text-gray-500 text-xs"
        >
          1v1
        </Badge>
      </div>
      <p className="text-gray-400 mb-8">
        A 1v1 duel combining melee, bow, building, rod play, and healing.
        Outlast your opponent in a mirrored arena.
      </p>

      {/* Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Rules</h2>
        <div className="space-y-3 text-sm">
          <Rule label="Players" value="1 per team (2 total) — Blue vs Red" />
          <Rule label="Duration" value="5 minutes (300 seconds)" />
          <Rule label="Countdown" value="5-second freeze before combat begins" />
          <Rule label="Win condition" value="Kill the opponent, or have more HP when time expires" />
          <Rule label="Sudden death" value="If HP is tied at timeout, 30s sudden death (no healing). Blue wins final tiebreak." />
          <Rule label="Disconnect" value="Instant forfeit. Opponent wins immediately." />
          <Rule label="Block breaks" value="Only player-placed blocks can be broken. No drops." />
          <Rule label="Build limit" value="Y = 81 (16 blocks above the floor)" />
        </div>
      </section>

      {/* Loadout */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Loadout</h2>
        <p className="text-gray-400 text-sm mb-3">
          Both players spawn with the same fixed kit:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <LoadoutItem name="Iron Sword" quantity="1" />
          <LoadoutItem name="Bow" quantity="1" />
          <LoadoutItem name="Arrow" quantity="32" />
          <LoadoutItem name="Fishing Rod" quantity="1" />
          <LoadoutItem name="Concrete" quantity="64 (team color)" />
          <LoadoutItem name="Golden Apple" quantity="2" />
          <LoadoutItem name="Water Bucket" quantity="1" />
          <LoadoutItem name="Health" quantity="20 (10 hearts)" />
          <LoadoutItem name="Food" quantity="20 (full)" />
        </div>
        <Alert className="bg-[#111] border-[#333] mt-4">
          <Info className="h-4 w-4 text-princeton-orange" />
          <AlertTitle className="text-white text-sm">
            Team-colored blocks
          </AlertTitle>
          <AlertDescription className="text-gray-500 text-sm">
            Blue team gets Blue Concrete, Red team gets Red Concrete. Use them
            for cover, elevation, and blocking arrows.
          </AlertDescription>
        </Alert>
      </section>

      {/* Arena */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Arena</h2>
        <p className="text-gray-400 text-sm">
          A mirrored arena loaded from a schematic. Blue team spawns at{' '}
          <code className="text-princeton-orange">(25, 65, 0)</code> facing
          west, red team at{' '}
          <code className="text-princeton-orange">(-25, 65, 0)</code> facing
          east. The floor is at Y 65, and blocks cannot be placed above Y 81.
          During the 5-second countdown, players are frozen with Slowness and
          Jump Boost effects.
        </p>
      </section>

      {/* Gameplay Flow */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Gameplay Flow</h2>
        <div className="space-y-3">
          <FlowStep step="1" title="Countdown" description="5-second freeze. Players are immobilized at their spawns." />
          <FlowStep step="2" title="Fight" description="PvP enables. Open with bow pressure and positioning." />
          <FlowStep step="3" title="Build & Pressure" description="Place blocks for cover, create angles, deny pushes." />
          <FlowStep step="4" title="Heal & Adapt" description="Use golden apples to stay ahead. Track opponent health." />
          <FlowStep step="5" title="Resolution" description="First kill wins. If time expires, higher HP wins. Tied HP triggers sudden death." />
        </div>
      </section>

      {/* Strategy tips */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Strategy Tips</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Bow opener:</strong> Take early bow
              shots at range before committing to melee. Getting the first hit
              advantage is huge.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Rod combos:</strong> Use the
              fishing rod to pull opponents out of position, then follow up with
              sword hits.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Build for cover:</strong> Place
              blocks to block arrows, create quick walls, or gain elevation for
              better bow angles.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Heal early:</strong> Use golden
              apples proactively — don&apos;t wait until 1 heart. You only get
              2, so make them count.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Water bucket:</strong> Place water
              to block fall damage or create a safe retreat path.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Arrow management:</strong> You have
              32 arrows. Track your ammo and switch to melee when running low.
            </span>
          </li>
        </ul>
      </section>

      {/* Example bot */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">Example Bot</h2>
        <CodeBlock
          filename="build-uhc-bot.ts"
          code={`import { Strategy, BotAPI, GameState } from '@blockwarriors/sdk';

export const buildUHCStrategy: Strategy = {
  onSpawn(bot) {
    console.log('Build UHC bot ready!');
  },

  onTick(bot, state) {
    const enemy = bot.nearbyEnemies[0];
    if (!enemy) return;

    const dist = bot.position.distanceTo(enemy.position);
    const myHealth = bot.health;

    // Heal if low HP and we have golden apples
    if (myHealth < 10 && bot.inventory.count('golden_apple') > 0) {
      bot.useItem('golden_apple');
      return;
    }

    if (dist > 15) {
      // Far away — shoot bow
      bot.equipItem('bow');
      bot.lookAt(enemy.position);
      bot.attack();
    } else if (dist > 4) {
      // Mid range — close distance, rod pull
      bot.sprint(true);
      bot.equipItem('fishing_rod');
      bot.attack();
      bot.goto(enemy.position.x, enemy.position.y, enemy.position.z);
    } else {
      // Melee range
      bot.sprint(false);
      bot.equipItem('iron_sword');
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

function FlowStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#111] border border-[#222]">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-princeton-orange/20 text-princeton-orange text-xs font-bold shrink-0">
        {step}
      </span>
      <div>
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}
