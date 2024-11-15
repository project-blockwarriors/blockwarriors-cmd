import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import {
  Home,
  Trophy,
  Users,
  Calendar,
  ArrowLeft,
  Gamepad2,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function DashboardSidebar({ className = "" }: SidebarProps) {
  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-8">
            <Gamepad2 className="h-8 w-8" />
            <h2 className="text-lg font-semibold">BlockWarriors</h2>
          </div>
          <Button variant="ghost" asChild className="w-full justify-start mb-8">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <div className="px-3">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Overview
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/matches" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Matches
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/teams" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teams
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}