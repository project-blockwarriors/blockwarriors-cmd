'use client';

import { cn } from '@/lib/utils';
import {
  Calendar,
  Gamepad2,
  Home,
  Trophy,
  Users,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SignOutButton } from '@/components/common/SignOutButton';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { authClient } from '@/lib/auth-client';

interface SidebarProps {
  className?: string;
}

interface DisabledButtonProps {
  children: React.ReactNode;
}

const DisabledButton = ({ children }: DisabledButtonProps) => (
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

interface NavButtonProps {
  href: string;
  children: React.ReactNode;
  hasCompletedSetup: boolean;
}

const NavButton = ({ href, children, hasCompletedSetup }: NavButtonProps) => {
  if (!hasCompletedSetup && href !== '/dashboard/setup') {
    return <DisabledButton>{children}</DisabledButton>;
  }
  return (
    <Button variant="ghost" className="w-full justify-start" asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
};

export function DashboardSidebar({ className = '' }: SidebarProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  
  // Subscribe to user profile changes in real-time
  const userProfile = useQuery(
    api.userProfiles.getUserProfile,
    userId ? { userId } : 'skip'
  );

  const hasCompletedSetup = userProfile?.first_name && userProfile?.team;

  const setupButton = (
    <NavButton href="/dashboard/setup" hasCompletedSetup={hasCompletedSetup}>
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
        {/* User profile */}
        <div className="px-4 py-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="font-semibold text-white truncate">
                {userProfile?.first_name && userProfile?.first_name}{' '}
                {userProfile?.last_name && userProfile?.last_name}
              </div>
              <div className="text-sm text-primary/70 truncate">
                {userProfile?.team ? userProfile.team.team_name : 'No Team'}
              </div>
            </div>
          </div>
        </div>
        <div className="px-3">
          <div className="space-y-1">
            {/* Only show Get Started at top if not complete */}
            {!hasCompletedSetup && setupButton}

            <NavButton href="/dashboard" hasCompletedSetup={hasCompletedSetup}>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Overview
              </div>
            </NavButton>
            <NavButton href="/dashboard/matches" hasCompletedSetup={hasCompletedSetup}>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Matches
              </div>
            </NavButton>
            <NavButton href="/dashboard/teams" hasCompletedSetup={hasCompletedSetup}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teams
              </div>
            </NavButton>
            <NavButton href="/dashboard/leaderboard" hasCompletedSetup={hasCompletedSetup}>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </div>
            </NavButton>
            <NavButton href="/dashboard/practice" hasCompletedSetup={hasCompletedSetup}>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Practice
              </div>
            </NavButton>

            {/* Show Get Started at bottom if complete */}
            {hasCompletedSetup && (
              <div className="pt-4 mt-4 border-t border-border">
                {setupButton}
              </div>
            )}
            
            {/* Sign Out Button */}
            <div className="pt-4 mt-4 border-t border-border">
              <SignOutButton variant="ghost" className="w-full justify-start" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
