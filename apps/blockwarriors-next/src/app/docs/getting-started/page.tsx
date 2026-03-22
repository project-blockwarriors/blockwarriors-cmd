'use client';

import { CodeBlock } from '../components/CodeBlock';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Terminal } from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Getting Started</h1>
      <p className="text-gray-400 mb-8">
        Set up your development environment and run your first bot in under 10
        minutes.
      </p>

      {/* Prerequisites */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          Prerequisites
        </h2>
        <ul className="space-y-3">
          {[
            {
              name: 'Node.js 20+',
              detail: 'Download from nodejs.org',
            },
            {
              name: 'npm or pnpm',
              detail: 'Comes with Node.js',
            },
            {
              name: 'A code editor',
              detail: 'VS Code recommended',
            },
            {
              name: 'BlockWarriors account',
              detail: 'Sign up at blockwarriors.ai',
            },
          ].map((item) => (
            <li key={item.name} className="flex items-start gap-3 text-sm">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-princeton-orange shrink-0" />
              <span>
                <strong className="text-white">{item.name}</strong>
                <span className="text-gray-500"> — {item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Step 1 */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-princeton-orange/10 text-princeton-orange border-none">
            Step 1
          </Badge>
          <h2 className="text-xl font-semibold text-white">
            Clone the starter bot
          </h2>
        </div>
        <CodeBlock
          code={`git clone https://github.com/project-blockwarriors/starter-bot.git
cd starter-bot
npm install`}
          language="bash"
        />
      </section>

      {/* Step 2 */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-princeton-orange/10 text-princeton-orange border-none">
            Step 2
          </Badge>
          <h2 className="text-xl font-semibold text-white">
            Write your strategy
          </h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Open <code className="text-princeton-orange">src/my-bot.ts</code> and
          implement the <code className="text-princeton-orange">Strategy</code>{' '}
          interface. Here&apos;s a minimal PvP bot:
        </p>
        <CodeBlock
          filename="src/my-bot.ts"
          code={`import { Strategy, BotAPI, GameState } from '@blockwarriors/sdk';

export const myStrategy: Strategy = {
  onSpawn(bot: BotAPI) {
    console.log('Bot spawned! Waiting for match to start...');
  },

  onTick(bot: BotAPI, state: GameState) {
    // Find the nearest enemy player
    const enemy = bot.nearbyEnemies[0];
    if (!enemy) return;

    const dist = bot.position.distanceTo(enemy.position);

    if (dist > 3) {
      // Move toward the enemy
      bot.goto(enemy.position.x, enemy.position.y, enemy.position.z);
    } else {
      // Close enough — attack!
      bot.attack();
    }
  },

  onDeath(bot: BotAPI) {
    console.log('Bot died!');
  },
};`}
        />
      </section>

      {/* Step 3 */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-princeton-orange/10 text-princeton-orange border-none">
            Step 3
          </Badge>
          <h2 className="text-xl font-semibold text-white">
            Get your match token
          </h2>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          When a tournament match is created, each team member receives a unique
          token. Find yours on the{' '}
          <strong className="text-white">Dashboard &rarr; My Matches</strong>{' '}
          page.
        </p>
        <Alert className="bg-[#111] border-[#333]">
          <Info className="h-4 w-4 text-princeton-orange" />
          <AlertTitle className="text-white text-sm">
            Tokens are single-use
          </AlertTitle>
          <AlertDescription className="text-gray-500 text-sm">
            Each token is tied to one match and one player slot. Once the match
            ends, the token expires.
          </AlertDescription>
        </Alert>
      </section>

      {/* Step 4 */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-princeton-orange/10 text-princeton-orange border-none">
            Step 4
          </Badge>
          <h2 className="text-xl font-semibold text-white">Run your bot</h2>
        </div>
        <CodeBlock
          code={`npm start -- --host play.blockwarriors.ai --port 25565 --ign YourBotName --token YOUR_TOKEN`}
          language="bash"
        />
        <p className="text-gray-400 text-sm mt-3">
          Your bot will connect to the server, authenticate with{' '}
          <code className="text-princeton-orange">/login TOKEN</code>, and wait
          for the match to start. Once all players are connected, the countdown
          begins automatically.
        </p>
      </section>

      {/* Multi-bot */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">
          Running multiple bots (team games)
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          For 4v4 games like CTF, you need to run 4 bots. Use the team launcher:
        </p>
        <CodeBlock
          code={`npm run team -- --host play.blockwarriors.ai --port 25565 \\
  --tokens TOKEN1,TOKEN2,TOKEN3,TOKEN4`}
          language="bash"
        />
      </section>

      {/* What's next */}
      <section className="p-4 rounded-lg border border-[#333] bg-[#111]">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-princeton-orange" />
          <h3 className="text-sm font-medium text-white">What&apos;s next?</h3>
        </div>
        <ul className="text-sm text-gray-500 space-y-1.5">
          <li>
            Read the{' '}
            <a
              href="/docs/bot-api"
              className="text-princeton-orange hover:underline"
            >
              Bot API Reference
            </a>{' '}
            for all available commands and state
          </li>
          <li>
            Check out{' '}
            <a
              href="/docs/games"
              className="text-princeton-orange hover:underline"
            >
              Game Modes
            </a>{' '}
            for rules and strategies
          </li>
          <li>
            Learn how{' '}
            <a
              href="/docs/tournaments"
              className="text-princeton-orange hover:underline"
            >
              Tournaments
            </a>{' '}
            work
          </li>
        </ul>
      </section>
    </div>
  );
}
