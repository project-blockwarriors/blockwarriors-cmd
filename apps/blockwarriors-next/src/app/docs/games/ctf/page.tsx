'use client';

import { CodeBlock } from '../../components/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Flag, Info } from 'lucide-react';

export default function CTFPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Flag className="w-6 h-6 text-princeton-orange" />
        <h1 className="text-3xl font-bold text-white">Capture the Flag</h1>
        <Badge
          variant="outline"
          className="border-[#444] text-gray-500 text-xs"
        >
          4v4
        </Badge>
      </div>
      <p className="text-gray-400 mb-8">
        Team-based flag capture. Coordinate 4 bots to steal the enemy flag and
        defend your own. First to 3 captures wins.
      </p>

      {/* Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Rules</h2>
        <div className="space-y-3 text-sm">
          <Rule label="Players" value="4 per team (8 total)" />
          <Rule label="Win condition" value="Capture the enemy flag 3 times" />
          <Rule label="Flag pickup" value="Walk within 2 blocks of the enemy flag" />
          <Rule label="Flag capture" value="Carry enemy flag to your own base flag location" />
          <Rule label="Flag drop" value="Carrier dies → flag drops at death location" />
          <Rule label="Flag return" value="Walk within 2 blocks of your dropped flag to return it" />
          <Rule label="Respawn" value="5-second timer at team base" />
          <Rule label="Time limit" value="8 minutes. Most captures wins. Tied = draw." />
          <Rule label="Disconnect" value="30-second grace period. 2+ disconnects = team forfeit." />
        </div>
      </section>

      {/* Loadout */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Loadout</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <LoadoutItem name="Iron Sword" quantity="1" />
          <LoadoutItem name="Bow" quantity="1" />
          <LoadoutItem name="Arrows" quantity="32" />
          <LoadoutItem name="Golden Apples" quantity="3" />
          <LoadoutItem name="Leather Armor" quantity="Full set (team-colored)" />
          <LoadoutItem name="Health" quantity="20 (10 hearts)" />
        </div>
      </section>

      {/* Arena */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Arena</h2>
        <p className="text-gray-400 text-sm mb-3">
          80x80 stone map with two walled bases and mid-field cover walls.
          Each base has a flag on a gold block pedestal.
        </p>
        <div className="p-4 rounded-lg bg-[#111] border border-[#222] font-mono text-xs text-gray-500 leading-relaxed">
          <pre>{`  [Red Base]           [Mid Walls]           [Blue Base]
   Flag on               Stone              Flag on
   Gold Block            Cover               Gold Block
   4 spawns              Walls               4 spawns

  80 blocks wide, surrounded by bedrock walls`}</pre>
        </div>
      </section>

      {/* Strategy tips */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Strategy Tips</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Role assignment:</strong> With 4
              bots, assign roles — 2 attackers (rush enemy flag), 1 defender
              (guard your flag), 1 support (mid-field control and flag returns).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Flag carrier escort:</strong> When
              a bot picks up the flag, other bots should escort it back.
              Track the flag status in game state.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Golden apples:</strong> Use them
              when your health is low during combat. They give absorption
              hearts — save them for critical moments.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
            <span>
              <strong className="text-white">Flag recovery:</strong> If your
              flag is dropped, returning it is higher priority than attacking.
              Walk within 2 blocks to instantly return it.
            </span>
          </li>
        </ul>
      </section>

      {/* Multi-bot example */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">
          Multi-Bot Strategy
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          In 4v4 games, you can assign different strategies to each bot:
        </p>
        <CodeBlock
          filename="run-team.ts"
          code={`// Assign roles by bot index
const strategies = [
  attackerStrategy,   // Bot 1: rush enemy flag
  attackerStrategy,   // Bot 2: rush enemy flag
  defenderStrategy,   // Bot 3: guard own flag
  supportStrategy,    // Bot 4: mid-field & flag returns
];`}
        />
      </section>

      <Alert className="bg-[#111] border-[#333]">
        <Info className="h-4 w-4 text-princeton-orange" />
        <AlertTitle className="text-white text-sm">
          Team coordination is key
        </AlertTitle>
        <AlertDescription className="text-gray-500 text-sm">
          CTF rewards teams that coordinate their 4 bots. A team with
          specialized roles (attacker, defender, support) will outperform
          4 identical rush bots.
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
