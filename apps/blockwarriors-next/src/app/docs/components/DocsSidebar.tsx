'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Rocket,
  Code2,
  Swords,
  Trophy,
  HelpCircle,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  {
    href: '/docs',
    label: 'Overview',
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    href: '/docs/getting-started',
    label: 'Getting Started',
    icon: <Rocket className="w-4 h-4" />,
  },
  {
    href: '/docs/bot-api',
    label: 'Bot API Reference',
    icon: <Code2 className="w-4 h-4" />,
  },
  {
    href: '/docs/games',
    label: 'Games',
    icon: <Swords className="w-4 h-4" />,
    children: [
      { href: '/docs/games/pvp', label: 'PvP (1v1)' },
      { href: '/docs/games/bridge', label: 'Bridge (1v1)' },
      { href: '/docs/games/ctf', label: 'CTF (4v4)' },
      { href: '/docs/games/build-uhc', label: 'Build UHC (1v1)' },
    ],
  },
  {
    href: '/docs/tournaments',
    label: 'Tournaments',
    icon: <Trophy className="w-4 h-4" />,
  },
  {
    href: '/docs/faq',
    label: 'FAQ',
    icon: <HelpCircle className="w-4 h-4" />,
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.children?.some((c) => pathname === c.href) ?? false);

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-princeton-orange/10 text-princeton-orange font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
            {item.children && isActive && (
              <div className="ml-7 mt-1 space-y-1 border-l border-[#333]">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'block pl-3 py-1.5 text-sm transition-colors',
                      pathname === child.href
                        ? 'text-princeton-orange font-medium'
                        : 'text-gray-500 hover:text-white'
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
