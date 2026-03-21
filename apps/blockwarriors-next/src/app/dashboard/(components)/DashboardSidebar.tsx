'use client';

import { cn } from '@/lib/utils';
import {
  Calendar,
  Gamepad2,
  Home,
  Trophy,
  Users,
  User,
  Swords,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
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
        <p>Complete setup first to unlock access to the rest of the dashboard</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface NavButtonProps {
  href: string;
  children: React.ReactNode;
  hasCompletedSetup: boolean;
  isActive: boolean;
}

const NavButton = ({ href, children, hasCompletedSetup, isActive }: NavButtonProps) => {
  if (!hasCompletedSetup && href !== '/dashboard/setup') {
    return <DisabledButton>{children}</DisabledButton>;
  }
  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start relative transition-colors',
        isActive &&
          'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3/5 before:w-[3px] before:rounded-full before:bg-primary'
      )}
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
};

export function DashboardSidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const userProfile = useQuery(
    api.userProfiles.getUserProfile,
    userId ? { userId } : 'skip'
  );

  const hasCompletedSetup = Boolean(userProfile?.first_name && userProfile?.team);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <div className={cn('pb-12 min-h-screen', className)}>
      <div className="space-y-4 py-4">
        {/* User Profile Header */}
        <Link href={hasCompletedSetup ? '/dashboard/profile' : '/dashboard/setup'}>
          <div className="px-4 py-4 border-b border-primary/20 hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                {userProfile?.profile_image_url ? (
                  <Image
                    src={userProfile.profile_image_url}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-semibold text-white truncate">
                  {userProfile?.first_name} {userProfile?.last_name}
                </div>
                <div className="text-sm text-primary/70 truncate">
                  {userProfile?.team ? userProfile.team.team_name : 'No Team'}
                </div>
              </div>
            </div>
          </div>
        </Link>

        <div className="px-3">
          <div className="space-y-1">
            {!hasCompletedSetup && (
              <NavButton href="/dashboard/setup" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/setup')}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Get Started (Required)
                </div>
              </NavButton>
            )}

            <NavButton href="/dashboard" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard')}>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Overview
              </div>
            </NavButton>
            <NavButton href="/dashboard/matches" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/matches')}>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Matches
              </div>
            </NavButton>
            <NavButton href="/dashboard/teams" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/teams')}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Teams
              </div>
            </NavButton>
            <NavButton href="/dashboard/leaderboard" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/leaderboard')}>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </div>
            </NavButton>
            <NavButton href="/dashboard/tournaments" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/tournaments')}>
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4" />
                Tournaments
              </div>
            </NavButton>
            <NavButton href="/dashboard/practice" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/practice')}>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Practice
              </div>
            </NavButton>

            {hasCompletedSetup && (
              <div className="pt-4 mt-4 border-t border-border space-y-1">
                <NavButton href="/dashboard/profile" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/profile')}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Profile
                  </div>
                </NavButton>
                <NavButton href="/dashboard/team" hasCompletedSetup={hasCompletedSetup} isActive={isActive('/dashboard/team')}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    My Team
                  </div>
                </NavButton>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-border">
              <SignOutButton variant="ghost" className="w-full justify-start" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
