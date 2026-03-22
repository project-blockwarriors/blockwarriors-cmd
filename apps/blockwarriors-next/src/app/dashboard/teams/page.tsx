'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  Trophy,
  Search,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/convex';
import { authClient } from '@/lib/auth-client';

export default function TeamsPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [searchQuery, setSearchQuery] = useState('');

  // Get user's profile to highlight their team
  const userProfile = useQuery(
    api.userProfiles.getUserProfile,
    userId ? { userId } : 'skip'
  );

  // Get all teams with members
  const teams = useQuery(api.teams.getAllTeamsWithMembers, {});

  const userTeamId = userProfile?.team?.id;

  // Filter teams by search query
  const filteredTeams =
    teams?.filter(
      (team) =>
        team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.members.some((m) =>
          `${m.first_name} ${m.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
    ) ?? [];

  // Sort by ELO
  const sortedTeams = [...filteredTeams].sort(
    (a, b) => b.team_elo - a.team_elo
  );

  // Calculate stats
  const totalTeams = teams?.length ?? 0;
  const totalMembers =
    teams?.reduce((acc, team) => acc + team.members.length, 0) ?? 0;
  const avgElo =
    teams && teams.length > 0
      ? Math.round(
          teams.reduce((acc, team) => acc + team.team_elo, 0) / teams.length
        )
      : 0;

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  const getWinRateTrend = (winRate: number) => {
    if (winRate >= 60)
      return { icon: TrendingUp, color: 'text-green-400', label: 'Strong' };
    if (winRate >= 40)
      return { icon: Minus, color: 'text-yellow-400', label: 'Average' };
    return { icon: TrendingDown, color: 'text-red-400', label: 'Struggling' };
  };

  if (teams === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Tournament Teams
              </h1>
              <p className="text-muted-foreground">
                <span className="text-primary font-medium">{totalTeams}</span>{' '}
                teams competing for glory
              </p>
            </div>
          </div>
        </div>
        <Link href="/dashboard/setup/team">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-3xl font-bold text-white">{totalTeams}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-3xl font-bold text-blue-400">
                  {totalMembers}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average ELO</p>
                <p className="text-3xl font-bold text-amber-400">{avgElo}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-primary/10">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams or players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      {sortedTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20">
            <Users className="h-10 w-10 text-primary/50" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No teams found</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchQuery
              ? 'Try a different search term'
              : 'Be the first to create a team!'}
          </p>
          <Link href="/dashboard/setup/team">
            <Button>Create Team</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedTeams.map((team, index) => {
            const winRate = getWinRate(team.team_wins, team.team_losses);
            const trend = getWinRateTrend(winRate);
            const TrendIcon = trend.icon;
            const isMyTeam = team.id === userTeamId;
            const rank = index + 1;

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`group transition-all hover:shadow-lg ${
                    isMyTeam
                      ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary'
                      : 'border-primary/10 hover:border-primary/30 hover:shadow-primary/5'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            rank === 1
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black'
                              : rank === 2
                                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black'
                                : rank === 3
                                  ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                                  : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          #{rank}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg text-white">
                              {team.team_name}
                            </CardTitle>
                            {isMyTeam && (
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                Your Team
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {team.members.length} member
                            {team.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="font-bold text-xl text-primary">
                              {team.team_elo}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">ELO</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Win/Loss Stats */}
                    <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-secondary/30">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            Win Rate
                          </span>
                          <div className="flex items-center gap-1">
                            <TrendIcon className={`h-3 w-3 ${trend.color}`} />
                            <span className={trend.color}>{winRate}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-center px-3 py-1 rounded-lg bg-green-500/10">
                          <p className="font-bold text-green-400">
                            {team.team_wins}
                          </p>
                          <p className="text-xs text-green-400/70">W</p>
                        </div>
                        <div className="text-center px-3 py-1 rounded-lg bg-red-500/10">
                          <p className="font-bold text-red-400">
                            {team.team_losses}
                          </p>
                          <p className="text-xs text-red-400/70">L</p>
                        </div>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Team Members
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((member, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm"
                          >
                            {member.user_id === team.leader_id && (
                              <Crown className="h-3 w-3 text-amber-400" />
                            )}
                            <span className="text-white/80">
                              {member.first_name} {member.last_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
