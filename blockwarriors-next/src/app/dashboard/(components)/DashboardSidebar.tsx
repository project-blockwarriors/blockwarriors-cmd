import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Gamepad2,
  Home,
  Trophy,
  Users,
  User,
  ChartColumnIncreasing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getUserProfile } from '@/server/actions/users';
import { getUser } from '@/auth/server';

interface SidebarProps {
  className?: string;
}

export async function DashboardSidebar({ className = '' }: SidebarProps) {
  const authUser = await getUser();
  const userProfile = authUser ? await getUserProfile(authUser.id) : null;
  const hasCompletedSetup = userProfile?.first_name && userProfile?.team;

  const DisabledButton = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start opacity-50 cursor-not-allowed"
            disabled
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Complete setup first to access this feature</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const NavButton = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => {
    if (!hasCompletedSetup && href !== '/dashboard/setup') {
      return <DisabledButton href={href}>{children}</DisabledButton>;
    }
    return (
      <Button variant="ghost" className="w-full justify-start" asChild>
        <Link href={href}>{children}</Link>
      </Button>
    );
  };

  const setupButton = (
    <NavButton href="/dashboard/setup">
      <div
        className={cn(
          'flex items-center gap-2',
          hasCompletedSetup && 'opacity-70'
        )}
      >
        <User className="h-4 w-4" />
        {hasCompletedSetup ? 'Profile & Team' : 'Get Started (Required)'}
      </div>
    </NavButton>
  );

  return (
    <div className={cn('pb-12 min-h-screen', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <div className="font-medium truncate">
                {userProfile?.first_name && userProfile?.first_name}{' '}
                {userProfile?.last_name && userProfile?.last_name}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {userProfile?.team ? userProfile.team.team_name : 'No Team'}
              </div>
            </div>
          </div>
        </div>
        <div className="px-3">
          <div className="space-y-1">
            {/* Only show Get Started at top if not complete */}
            {!hasCompletedSetup && setupButton}

            <NavButton href="/dashboard">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Overview
              </div>
            </NavButton>
            <NavButton href="/dashboard/matches">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Matches
              </div>
            </NavButton>
            <NavButton href="/dashboard/teams">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teams
              </div>
            </NavButton>
            <NavButton href="/dashboard/leaderboard">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </div>
            </NavButton>
            <NavButton href="/dashboard/practice">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Practice
              </div>
            </NavButton>
            <NavButton href="/dashboard/stats">
              <div className="flex items-center gap-2">
                <ChartColumnIncreasing className="h-4 w-4" />
                Stats
              </div>
            </NavButton>

            {/* Show Get Started at bottom if complete */}
            {hasCompletedSetup && (
              <div className="pt-4 mt-4 border-t border-border">
                {setupButton}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
