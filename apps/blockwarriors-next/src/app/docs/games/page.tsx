'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const games = [
  {
    href: '/docs/games/pvp',
    name: 'PvP',
    format: '1v1',
    status: 'Live',
    description:
      'Classic 1v1 combat. Two players fight until one is eliminated. No respawns.',
  },
  {
    href: '/docs/games/bridge',
    name: 'Bridge',
    format: '1v1',
    status: 'Live',
    description:
      'Build a bridge across the void to reach the enemy goal zone. First to 5 points wins.',
  },
  {
    href: '/docs/games/ctf',
    name: 'Capture the Flag',
    format: '4v4',
    status: 'Live',
    description:
      'Team-based flag capture. Coordinate 4 bots to steal the enemy flag and defend your own.',
  },
  {
    href: '/docs/games/build-uhc',
    name: 'Build UHC',
    format: '1v1',
    status: 'Live',
    description:
      '1v1 duel with building, bow, melee, rod play, and healing. Outlast your opponent in a mirrored arena.',
  },
];

export default function GamesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Game Modes</h1>
      <p className="text-gray-400 mb-8">
        BlockWarriors features multiple game modes with different team sizes,
        mechanics, and strategic depth.
      </p>

      <div className="space-y-4">
        {games.map((game) => {
          const isLive = game.status === 'Live';
          const Wrapper = isLive ? Link : 'div';

          return (
            <Wrapper
              key={game.name}
              href={game.href}
              className={isLive ? 'group block' : 'block opacity-60'}
            >
              <Card className="bg-[#1a1a1a] border-[#333] hover:border-princeton-orange/40 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <CardTitle className="text-white group-hover:text-princeton-orange transition-colors text-lg">
                      {game.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-[#444] text-gray-500 text-[10px]"
                    >
                      {game.format}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        isLive
                          ? 'border-green-800/40 text-green-500 text-[10px]'
                          : 'border-[#444] text-gray-600 text-[10px]'
                      }
                    >
                      {game.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-500">
                    {game.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
