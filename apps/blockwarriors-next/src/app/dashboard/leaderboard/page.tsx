'use client';

import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  TrendingUp,
  Target,
  Crown,
  Flame,
  Zap,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/convex';
import { authClient } from '@/lib/auth-client';

export default function LeaderboardPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Get user's profile to highlight their team
  const userProfile = useQuery(
    api.userProfiles.getUserProfile,
    userId ? { userId } : 'skip'
  );

  // Get all teams scores (already sorted by ELO from the query)
  const teams = useQuery(api.teams.getAllTeamsScores, {});

  const userTeamId = userProfile?.team?.id;

  // Calculate stats
  const topTeam = teams?.[0];
  const totalMatches =
    teams?.reduce((acc, team) => acc + team.team_wins + team.team_losses, 0) ??
    0;
  const avgElo =
    teams && teams.length > 0
      ? Math.round(
          teams.reduce((acc, team) => acc + team.team_elo, 0) / teams.length
        )
      : 0;

  // Find user's team rank
  const userTeamRank = teams?.findIndex((team) => team.id === userTeamId) ?? -1;
  const userTeam = userTeamRank >= 0 ? teams?.[userTeamRank] : null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1)
      return 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30';
    if (rank === 2)
      return 'bg-gradient-to-br from-gray-300 to-gray-400 text-black shadow-lg shadow-gray-400/20';
    if (rank === 3)
      return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-700/20';
    return 'bg-secondary text-muted-foreground';
  };

  const getRowStyle = (rank: number, isMyTeam: boolean) => {
    if (isMyTeam)
      return 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-primary/50';
    if (rank <= 3)
      return 'bg-primary/5 border-primary/20 hover:border-primary/40';
    return 'bg-secondary/30 border-primary/10 hover:border-primary/20';
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/5 flex items-center justify-center border border-amber-500/20">
              <Trophy className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
              <p className="text-muted-foreground">
                Top performers ranked by{' '}
                <span className="text-primary font-medium">ELO rating</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {teams && teams.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <Card className="w-full border-gray-400/30 bg-gradient-to-b from-gray-400/10 to-transparent">
              <CardContent className="pt-6 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-gray-400/20">
                  <Medal className="h-8 w-8 text-black" />
                </div>
                <p className="text-lg font-bold text-white mb-1">
                  {teams[1].team_name}
                </p>
                <div className="flex items-center justify-center gap-1 text-gray-300">
                  <Trophy className="h-4 w-4" />
                  <span className="font-bold text-xl">{teams[1].team_elo}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {teams[1].team_wins}W - {teams[1].team_losses}L
                </p>
              </CardContent>
            </Card>
            <div className="h-20 w-full bg-gradient-to-t from-gray-400/20 to-transparent rounded-b-xl -mt-2"></div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center -mt-6"
          >
            <Card className="w-full border-amber-500/30 bg-gradient-to-b from-amber-500/20 to-transparent">
              <CardContent className="pt-8 text-center">
                <div className="relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Crown className="h-8 w-8 text-amber-400 animate-pulse" />
                  </div>
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20">
                    <Star className="h-10 w-10 text-black" />
                  </div>
                </div>
                <p className="text-xl font-bold text-white mb-1">
                  {teams[0].team_name}
                </p>
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  <Trophy className="h-5 w-5" />
                  <span className="font-bold text-2xl">
                    {teams[0].team_elo}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {teams[0].team_wins}W - {teams[0].team_losses}L
                </p>
              </CardContent>
            </Card>
            <div className="h-28 w-full bg-gradient-to-t from-amber-500/20 to-transparent rounded-b-xl -mt-2"></div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center mt-4"
          >
            <Card className="w-full border-amber-700/30 bg-gradient-to-b from-amber-700/10 to-transparent">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-700/20">
                  <Medal className="h-7 w-7 text-white" />
                </div>
                <p className="text-lg font-bold text-white mb-1">
                  {teams[2].team_name}
                </p>
                <div className="flex items-center justify-center gap-1 text-amber-600">
                  <Trophy className="h-4 w-4" />
                  <span className="font-bold text-xl">{teams[2].team_elo}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {teams[2].team_wins}W - {teams[2].team_losses}L
                </p>
              </CardContent>
            </Card>
            <div className="h-12 w-full bg-gradient-to-t from-amber-700/20 to-transparent rounded-b-xl -mt-2"></div>
          </motion.div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-2xl font-bold text-white">{teams?.length}</p>
              </div>
              <Flame className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top ELO</p>
                <p className="text-2xl font-bold text-amber-400">
                  {topTeam?.team_elo ?? 0}
                </p>
              </div>
              <Crown className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg ELO</p>
                <p className="text-2xl font-bold text-blue-400">{avgElo}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold text-green-400">
                  {Math.floor(totalMatches / 2)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Team Highlight */}
      {userTeam && userTeamRank >= 0 && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                  #{userTeamRank + 1}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {userTeam.team_name}
                  </p>
                  <p className="text-sm text-primary">Your Team</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">W / L</p>
                  <p className="font-semibold text-white">
                    <span className="text-green-400">{userTeam.team_wins}</span>
                    {' / '}
                    <span className="text-red-400">{userTeam.team_losses}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">ELO</p>
                  <p className="font-bold text-xl text-primary">
                    {userTeam.team_elo}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Rankings */}
      <Card className="border-primary/10">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Full Rankings</CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              {teams?.length} teams
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {teams?.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No teams on the leaderboard yet
                </p>
              </div>
            ) : (
              teams?.map((team, index) => {
                const rank = index + 1;
                const isMyTeam = team.id === userTeamId;
                const winRate =
                  team.team_wins + team.team_losses > 0
                    ? Math.round(
                        (team.team_wins / (team.team_wins + team.team_losses)) *
                          100
                      )
                    : 0;

                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${getRowStyle(rank, isMyTeam)}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-11 w-11 rounded-lg flex items-center justify-center font-bold ${getRankStyle(rank)}`}
                      >
                        {getRankIcon(rank) || rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">
                            {team.team_name}
                          </p>
                          {isMyTeam && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-green-400">
                            {team.team_wins}W
                          </span>
                          <span>-</span>
                          <span className="text-red-400">
                            {team.team_losses}L
                          </span>
                          <span className="text-primary/50">•</span>
                          <span>{winRate}% WR</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p
                          className={`font-bold text-2xl ${
                            rank <= 3 ? 'text-primary' : 'text-white'
                          }`}
                        >
                          {team.team_elo}
                        </p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      {rank <= 3 && (
                        <TrendingUp className="h-5 w-5 text-green-400 ml-2" />
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
