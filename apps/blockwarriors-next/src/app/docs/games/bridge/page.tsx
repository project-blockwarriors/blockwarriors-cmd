'use client';

import { CodeBlock } from '../../components/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Blocks, Info } from 'lucide-react';

export default function BridgePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Blocks className="w-6 h-6 text-princeton-orange" />
        <h1 className="text-3xl font-bold text-white">Bridge</h1>
        <Badge
          variant="outline"
          className="border-[#444] text-gray-500 text-xs"
        >
          1v1
        </Badge>
      </div>
      <p className="text-gray-400 mb-8">
        Build a bridge across the void and enter the enemy goal zone to score.
        First to 5 points wins.
      </p>

      {/* Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Rules</h2>
        <div className="space-y-3 text-sm">
          <Rule label="Players" value="1 per team (2 total)" />
          <Rule label="Win condition" value="Score 5 goals (enter enemy goal zone)" />
          <Rule label="Scoring" value="Step onto the 3x3 goal zone at the back of the enemy platform" />
          <Rule label="Death" value="Respawn on own platform after 2 seconds (no point for opponent)" />
          <Rule label="Time limit" value="5 minutes. Highest score wins. Tied = sudden death (next goal wins)." />
          <Rule label="Disconnect" value="Instant forfeit" />
        </div>
      </section>

      {/* Loadout */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Loadout</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <LoadoutItem name="Stone Sword" quantity="1" />
          <LoadoutItem name="Bow" quantity="1" />
          <LoadoutItem name="Arrows" quantity="16" />
          <LoadoutItem name="Iron Boots" quantity="Equipped" />
          <LoadoutItem name="Team Blocks" quantity="64" />
          <LoadoutItem name="Health" quantity="20 (10 hearts)" />
        </div>
      </section>

      {/* Arena */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Arena</h2>
        <p className="text-gray-400 text-sm mb-3">
          Two 15x15 platforms separated by a 25-block void gap. Each platform
          has a 3x3 goal zone at the back marked with stained glass.
        </p>
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] font-mono text-xs text-gray-500 leading-relaxed">
          <pre>{`  [Blue Goal]  [Blue Platform]  ~~void~~  [Red Platform]  [Red Goal]
     3x3         15x15          25 gap       15x15          3x3

  Blue spawns on Blue Platform, must reach Red Goal to score.
  Red spawns on Red Platform, must reach Blue Goal to score.`}</pre>
        </div>
      </section>

      {/* Strategy tips */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Strategy Tips</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Bridge building:</strong> Place
              blocks while moving forward. Use{' '}
              <code className="text-princeton-orange">sneak(true)</code> to not
              fall off edges while placing blocks.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Speed vs. defense:</strong> You can
              sprint-bridge for speed or build walls to protect your bridge from
              bow shots.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Void kills:</strong> Knocking the
              opponent into the void forces a respawn — use the bow or sprint
              knockback.
            </span>
          </li>
        </ul>
      </section>

      <Alert className="bg-[#111] border-[#333]">
        <Info className="h-4 w-4 text-princeton-orange" />
        <AlertTitle className="text-white text-sm">
          Block placement
        </AlertTitle>
        <AlertDescription className="text-gray-500 text-sm">
          You receive 64 team-colored blocks. Place them to bridge across the
          void. Blocks respawn on death, so don&apos;t worry about running out.
        </AlertDescription>
      </Alert>
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

function LoadoutItem({ name, quantity }: { name: string; quantity: string }) {
  return (
    <div className="p-3 rounded-lg bg-[#111] border border-[#222] text-center">
      <p className="text-white text-sm font-medium">{name}</p>
      <p className="text-gray-500 text-xs mt-1">{quantity}</p>
    </div>
  );
}
