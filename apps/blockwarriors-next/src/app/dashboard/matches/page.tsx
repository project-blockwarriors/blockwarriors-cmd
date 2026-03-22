'use client';

import { useQuery } from 'convex/react';
import type { Id } from '@packages/backend/convex/_generated/dataModel';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  Swords,
  Clock,
  Trophy,
  Play,
  CheckCircle,
  XCircle,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/convex';
import { authClient } from '@/lib/auth-client';
import {
  TOURNAMENT_MATCH_STATUSES,
  TOURNAMENT_STATUSES,
  type TournamentMatchStatus,
} from '@/lib/tournament-constants';

// Tournament card with its matches
function TournamentMatchesCard({
  tournament,
  teamId,
}: {
  tournament: {
    _id: Id<'tournaments'>;
    name: string;
    status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
    format: string;
    participant_count: number;
  };
  teamId: string;
}) {
  const bracket = useQuery(api.tournamentMatches.getTournamentBracket, {
    tournamentId: tournament._id,
  });

  // Filter to team's matches only
  const teamMatches =
    bracket?.filter(
      (match) => match.team1_id === teamId || match.team2_id === teamId
    ) ?? [];

  // Stats for this tournament
  const matchesWon = teamMatches.filter(
    (m) =>
      m.status === 'completed' &&
      ((m.team1_id === teamId && m.winner_team_id === m.team1_id) ||
        (m.team2_id === teamId && m.winner_team_id === m.team2_id))
  ).length;
  const matchesLost = teamMatches.filter(
    (m) =>
      m.status === 'completed' &&
      m.winner_team_id &&
      ((m.team1_id === teamId && m.winner_team_id !== m.team1_id) ||
        (m.team2_id === teamId && m.winner_team_id !== m.team2_id))
  ).length;
  const upcomingMatches = teamMatches.filter(
    (m) => m.status === 'pending' || m.status === 'scheduled'
  );
  const inProgressMatches = teamMatches.filter(
    (m) => m.status === 'in_progress'
  );

  const getStatusIcon = (status: TournamentMatchStatus) => {
    switch (status) {
      case 'in_progress':
        return <Play className="h-4 w-4 text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getResultBadge = (match: (typeof teamMatches)[0], isTeam1: boolean) => {
    if (match.status !== 'completed' || !match.winner_team_id) return null;
    const isWinner = isTeam1
      ? match.winner_team_id === match.team1_id
      : match.winner_team_id === match.team2_id;
    return (
      <Badge
        className={
          isWinner
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30'
        }
      >
        {isWinner ? 'Win' : 'Loss'}
      </Badge>
    );
  };

  if (!bracket) {
    return (
      <Card className="border-primary/10 animate-pulse">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading matches...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 overflow-hidden">
      <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{tournament.name}</CardTitle>
              <p
                className={`text-sm ${TOURNAMENT_STATUSES[tournament.status].color}`}
              >
                {TOURNAMENT_STATUSES[tournament.status].name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{matchesWon}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{matchesLost}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <Link href={`/dashboard/tournaments/${tournament._id}`}>
              <Button variant="outline" size="sm">
                View Bracket
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {teamMatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No matches scheduled yet
          </div>
        ) : (
          <div className="divide-y divide-primary/5">
            {/* In Progress Matches First */}
            {inProgressMatches.map((match) => {
              const isTeam1 = match.team1_id === teamId;
              return (
                <Link
                  key={match._id}
                  href={`/dashboard/tournaments/${tournament._id}/matches/${match._id}`}
                >
                  <div className="group flex items-center justify-between p-4 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        {getStatusIcon(match.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-white">
                            vs{' '}
                            {isTeam1
                              ? (match.team2_name ?? 'TBD')
                              : (match.team1_name ?? 'TBD')}
                          </p>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
                            Live
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Round {match.round}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          {isTeam1
                            ? match.team1_games_won
                            : match.team2_games_won}{' '}
                          -{' '}
                          {isTeam1
                            ? match.team2_games_won
                            : match.team1_games_won}
                        </p>
                        <p className="text-sm text-yellow-400">In Progress</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Upcoming Matches */}
            {upcomingMatches.slice(0, 3).map((match) => {
              const isTeam1 = match.team1_id === teamId;
              return (
                <Link
                  key={match._id}
                  href={`/dashboard/tournaments/${tournament._id}/matches/${match._id}`}
                >
                  <div className="group flex items-center justify-between p-4 hover:bg-secondary/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getStatusIcon(match.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-white">
                            vs{' '}
                            {isTeam1
                              ? (match.team2_name ?? 'TBD')
                              : (match.team1_name ?? 'TBD')}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Round {match.round}
                          {match.scheduled_time && (
                            <>
                              {' '}
                              •{' '}
                              {new Date(
                                match.scheduled_time
                              ).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {TOURNAMENT_MATCH_STATUSES[match.status].name}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Recent Completed Matches */}
            {teamMatches
              .filter((m) => m.status === 'completed')
              .slice(0, 3)
              .map((match) => {
                const isTeam1 = match.team1_id === teamId;
                return (
                  <Link
                    key={match._id}
                    href={`/dashboard/tournaments/${tournament._id}/matches/${match._id}`}
                  >
                    <div className="group flex items-center justify-between p-4 hover:bg-secondary/30 transition-all cursor-pointer opacity-80">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                          {getStatusIcon(match.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-white">
                              vs{' '}
                              {isTeam1
                                ? (match.team2_name ?? 'TBD')
                                : (match.team1_name ?? 'TBD')}
                            </p>
                            {getResultBadge(match, isTeam1)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Round {match.round}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">
                            {isTeam1
                              ? match.team1_games_won
                              : match.team2_games_won}{' '}
                            -{' '}
                            {isTeam1
                              ? match.team2_games_won
                              : match.team1_games_won}
                          </p>
                          <p className="text-sm text-muted-foreground">Final</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}

            {/* Show more link */}
            {teamMatches.length > 6 && (
              <Link href={`/dashboard/tournaments/${tournament._id}`}>
                <div className="p-4 text-center text-primary hover:bg-primary/5 transition-all cursor-pointer">
                  View all {teamMatches.length} matches →
                </div>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MatchesPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Get user's profile to find their team
  const userProfile = useQuery(
    api.userProfiles.getUserProfile,
    userId ? { userId } : 'skip'
  );

  const teamId = userProfile?.team?.id;

  // Get tournaments where user's team is participating
  const myTournaments = useQuery(
    api.tournaments.getMyTournaments,
    userId ? { userId } : 'skip'
  );

  // Filter active tournaments (in_progress or registration)
  const activeTournaments =
    myTournaments?.filter(
      (t) => t.status === 'in_progress' || t.status === 'registration'
    ) ?? [];
  const completedTournaments =
    myTournaments?.filter((t) => t.status === 'completed') ?? [];

  if (!userProfile?.team) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20">
          <Calendar className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Team Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Join or create a team to see your tournament matches here.
        </p>
        <Link href="/dashboard/setup">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Set Up Team
          </Button>
        </Link>
      </motion.div>
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
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Your Matches</h1>
              <p className="text-muted-foreground">
                Tournament matches for{' '}
                <span className="text-primary font-medium">
                  {userProfile.team.team_name}
                </span>
              </p>
            </div>
          </div>
        </div>
        <Link href="/dashboard/tournaments">
          <Button variant="outline">
            <Trophy className="h-4 w-4 mr-2" />
            Browse Tournaments
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Active Tournaments
                </p>
                <p className="text-3xl font-bold text-white">
                  {activeTournaments.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-blue-400">
                  {completedTournaments.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team ELO</p>
                <p className="text-3xl font-bold text-green-400">
                  {userProfile.team.team_elo}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Swords className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">W/L Record</p>
                <p className="text-3xl font-bold">
                  <span className="text-green-400">
                    {userProfile.team.team_wins}
                  </span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-red-400">
                    {userProfile.team.team_losses}
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Play className="h-5 w-5 text-yellow-400" />
            Active Tournaments
          </h2>
          <div className="space-y-6">
            {activeTournaments.map((tournament) => (
              <TournamentMatchesCard
                key={tournament._id}
                tournament={tournament}
                teamId={teamId as string}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tournaments */}
      {completedTournaments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Completed Tournaments
          </h2>
          <div className="space-y-6">
            {completedTournaments.slice(0, 3).map((tournament) => (
              <TournamentMatchesCard
                key={tournament._id}
                tournament={tournament}
                teamId={teamId as string}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Tournaments State */}
      {(!myTournaments || myTournaments.length === 0) && (
        <Card className="border-primary/10">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Tournament Matches Yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your team hasn&apos;t joined any tournaments yet. Browse available
              tournaments and join one to start competing!
            </p>
            <Link href="/dashboard/tournaments">
              <Button>
                <Trophy className="h-4 w-4 mr-2" />
                Browse Tournaments
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
