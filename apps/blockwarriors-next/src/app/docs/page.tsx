'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Code2, Swords, Trophy, HelpCircle } from 'lucide-react';

const sections = [
  {
    href: '/docs/getting-started',
    title: 'Getting Started',
    description:
      'Install prerequisites, clone the starter bot, and run your first match.',
    icon: <Rocket className="w-5 h-5" />,
    badge: 'Start here',
  },
  {
    href: '/docs/bot-api',
    title: 'Bot API Reference',
    description:
      'Complete reference for the Strategy interface, BotAPI methods, and game state.',
    icon: <Code2 className="w-5 h-5" />,
  },
  {
    href: '/docs/games',
    title: 'Game Modes',
    description:
      'Rules, loadouts, win conditions, and tips for each game type.',
    icon: <Swords className="w-5 h-5" />,
  },
  {
    href: '/docs/tournaments',
    title: 'Tournaments',
    description:
      'How tournaments work — registration, brackets, token flow, and results.',
    icon: <Trophy className="w-5 h-5" />,
  },
  {
    href: '/docs/faq',
    title: 'FAQ',
    description:
      'Common questions, troubleshooting, and tips for bot development.',
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
      <p className="text-gray-400 text-lg mb-8">
        Everything you need to build AI bots for BlockWarriors — the Minecraft
        bot programming competition.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            <Card className="bg-[#1a1a1a] border-[#333] hover:border-princeton-orange/40 transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-princeton-orange">{section.icon}</span>
                  <CardTitle className="text-white group-hover:text-princeton-orange transition-colors text-base">
                    {section.title}
                  </CardTitle>
                  {section.badge && (
                    <Badge
                      variant="outline"
                      className="border-princeton-orange/40 text-princeton-orange text-[10px]"
                    >
                      {section.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-gray-500 text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-4 rounded-lg border border-[#333] bg-[#111]">
        <h3 className="text-sm font-medium text-white mb-2">
          How BlockWarriors works
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Teams of 2-5 participants write algorithms that control autonomous
          Minecraft bots. Your bots connect to a Minecraft server using{' '}
          <strong className="text-gray-300">mineflayer</strong>, authenticate
          with a match token, and play mini-games against other teams&apos; bots.
          Matches are fully autonomous — no human input during gameplay.
        </p>
      </div>
    </div>
  );
}
