'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/convex';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Trophy,
  ArrowLeft,
  Users,
  Calendar,
  Sparkles,
  Play,
  X,
  LogOut,
  ChevronRight,
  Crown,
  Medal,
  Target,
  Swords,
  Clock,
  CheckCircle,
  XCircle,
  Grid3X3,
  BarChart3,
  CalendarDays,
  Timer,
  Info,
} from 'lucide-react';
import {
  TOURNAMENT_STATUSES,
  TOURNAMENT_FORMATS,
  TOURNAMENT_MATCH_STATUSES,
  type TournamentMatchStatus,
} from '@/lib/tournament-constants';
import { authClient } from '@/lib/auth-client';

type ViewMode = 'matrix' | 'schedule' | 'teams' | 'rounds';

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { data: session } = authClient.useSession();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Get user's profile to find their team
  const userProfile = useQuery(
    api.userProfiles.getUserProfile,
    session?.user?.id ? { userId: session.user.id } : 'skip'
  );

  const userTeamId = userProfile?.team?.id;

  // Fetch tournament data
  const tournament = useQuery(
    api.tournaments.getTournament,
    tournamentId ? { tournamentId: tournamentId as Id<'tournaments'> } : 'skip'
  );
  const creatorProfile = useQuery(
    api.userProfiles.getUserProfile,
    tournament?.created_by ? { userId: tournament.created_by } : 'skip'
  );

  // Fetch participants
  const participants = useQuery(
    api.tournaments.getTournamentParticipants,
    tournamentId ? { tournamentId: tournamentId as Id<'tournaments'> } : 'skip'
  );

  // Fetch bracket/matches
  const bracket = useQuery(
    api.tournamentMatches.getTournamentBracket,
    tournamentId ? { tournamentId: tournamentId as Id<'tournaments'> } : 'skip'
  );

  // Fetch standings
  const standings = useQuery(
    api.tournamentMatches.getTournamentStandings,
    tournamentId ? { tournamentId: tournamentId as Id<'tournaments'> } : 'skip'
  );

  // Check if user's team is registered
  const isRegistered = useQuery(
    api.tournaments.isTeamRegistered,
    tournamentId && session?.user?.id
      ? {
          tournamentId: tournamentId as Id<'tournaments'>,
          userId: session.user.id,
        }
      : 'skip'
  );

  // Mutations
  const joinTournament = useMutation(api.tournaments.joinTournament);
  const leaveTournament = useMutation(api.tournaments.leaveTournament);
  const startTournament = useMutation(api.tournaments.startTournament);
  const cancelTournament = useMutation(api.tournaments.cancelTournament);

  // Create a matrix of matchups with round info
  const matchMatrix = useMemo(() => {
    if (!participants || !bracket) return null;

    const matrix: Record<
      string,
      Record<
        string,
        {
          matchId: string;
          status: TournamentMatchStatus;
          team1GamesWon: number;
          team2GamesWon: number;
          winnerId?: string;
          isTeam1: boolean;
          round: number;
          matchNumber: number;
          scheduledTime?: number;
        } | null
      >
    > = {};

    // Initialize matrix
    for (const team of participants) {
      matrix[team.team_id] = {};
      for (const opponent of participants) {
        matrix[team.team_id][opponent.team_id] = null;
      }
    }

    // Fill in matchups
    for (const match of bracket) {
      if (match.team1_id && match.team2_id) {
        matrix[match.team1_id][match.team2_id] = {
          matchId: match._id,
          status: match.status,
          team1GamesWon: match.team1_games_won,
          team2GamesWon: match.team2_games_won,
          winnerId: match.winner_team_id ?? undefined,
          isTeam1: true,
          round: match.round,
          matchNumber: match.match_number,
          scheduledTime: match.scheduled_time,
        };
        matrix[match.team2_id][match.team1_id] = {
          matchId: match._id,
          status: match.status,
          team1GamesWon: match.team2_games_won,
          team2GamesWon: match.team1_games_won,
          winnerId: match.winner_team_id ?? undefined,
          isTeam1: false,
          round: match.round,
          matchNumber: match.match_number,
          scheduledTime: match.scheduled_time,
        };
      }
    }

    return matrix;
  }, [participants, bracket]);

  // Group matches by team, sorted by round
  const matchesByTeam = useMemo(() => {
    if (!bracket || !participants) return {};

    const byTeam: Record<string, typeof bracket> = {};
    for (const p of participants) {
      byTeam[p.team_id] = bracket
        .filter((m) => m.team1_id === p.team_id || m.team2_id === p.team_id)
        .sort((a, b) => a.round - b.round || a.match_number - b.match_number);
    }
    return byTeam;
  }, [bracket, participants]);

  // Group matches by round
  const matchesByRound = useMemo(() => {
    if (!bracket) return {};
    const byRound: Record<number, typeof bracket> = {};
    for (const match of bracket) {
      if (!byRound[match.round]) byRound[match.round] = [];
      byRound[match.round].push(match);
    }
    return byRound;
  }, [bracket]);

  // Get user's team matches for "My Schedule" section
  const myTeamMatches = useMemo(() => {
    if (!userTeamId || !bracket) return [];
    return bracket
      .filter((m) => m.team1_id === userTeamId || m.team2_id === userTeamId)
      .sort((a, b) => a.round - b.round || a.match_number - b.match_number);
  }, [userTeamId, bracket]);

  // Sorted matches for schedule view
  const sortedMatches = useMemo(() => {
    if (!bracket) return [];
    return [...bracket].sort((a, b) => {
      // Sort by round first, then by match number
      if (a.round !== b.round) return a.round - b.round;
      return a.match_number - b.match_number;
    });
  }, [bracket]);

  // Count total rounds
  const totalRounds = useMemo(() => {
    if (!bracket) return 0;
    return Math.max(...bracket.map((m) => m.round), 0);
  }, [bracket]);

  const handleJoin = async () => {
    if (!session?.user?.id) return;
    setActionLoading('join');
    setError(null);
    try {
      const result = await joinTournament({
        tournamentId: tournamentId as Id<'tournaments'>,
        userId: session.user.id,
      });
      if (!result.success) {
        setError(result.error ?? 'Failed to join tournament');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tournament');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    if (!session?.user?.id) return;
    setActionLoading('leave');
    setError(null);
    try {
      const result = await leaveTournament({
        tournamentId: tournamentId as Id<'tournaments'>,
        userId: session.user.id,
      });
      if (!result.success) {
        setError(result.error ?? 'Failed to leave tournament');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave tournament');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async () => {
    if (!session?.user?.id) return;
    setActionLoading('start');
    setError(null);
    try {
      const result = await startTournament({
        tournamentId: tournamentId as Id<'tournaments'>,
        userId: session.user.id,
      });
      if (!result.success) {
        setError(result.error ?? 'Failed to start tournament');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tournament');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!session?.user?.id) return;
    if (!confirm('Are you sure you want to cancel this tournament?')) return;
    setActionLoading('cancel');
    setError(null);
    try {
      const result = await cancelTournament({
        tournamentId: tournamentId as Id<'tournaments'>,
        userId: session.user.id,
      });
      if (!result.success) {
        setError(result.error ?? 'Failed to cancel tournament');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel tournament');
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state
  if (tournament === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not found
  if (tournament === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Tournament Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            This tournament doesn&apos;t exist or has been removed.
          </p>
          <Link href="/dashboard/tournaments">
            <Button>Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = tournament.created_by === session?.user?.id;
  const canManage = isCreator;
  const statusInfo = TOURNAMENT_STATUSES[tournament.status];
  const formatInfo = TOURNAMENT_FORMATS[tournament.format];
  const hasMatches = bracket && bracket.length > 0;

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <div className="flex items-center gap-1 text-amber-400">
          <Crown className="h-4 w-4" />
          <span className="font-bold">1st</span>
        </div>
      );
    if (rank === 2)
      return (
        <div className="flex items-center gap-1 text-gray-300">
          <Medal className="h-4 w-4" />
          <span className="font-bold">2nd</span>
        </div>
      );
    if (rank === 3)
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <Medal className="h-4 w-4" />
          <span className="font-bold">3rd</span>
        </div>
      );
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const getMatchCellStyle = (
    matchup: NonNullable<typeof matchMatrix>[string][string] | null | undefined
  ) => {
    if (!matchup) return 'bg-secondary/20';
    if (matchup.status === 'completed') {
      if (matchup.team1GamesWon > matchup.team2GamesWon) {
        return 'bg-green-500/20 border-green-500/30';
      }
      if (matchup.team2GamesWon > matchup.team1GamesWon) {
        return 'bg-red-500/20 border-red-500/30';
      }
      return 'bg-orange-500/20 border-orange-500/30';
    }
    if (matchup.status === 'in_progress')
      return 'bg-yellow-500/20 border-yellow-500/30 animate-pulse';
    if (matchup.status === 'scheduled')
      return 'bg-blue-500/10 border-blue-500/20';
    return 'bg-secondary/30 border-secondary/50';
  };

  const getStatusIcon = (status: TournamentMatchStatus, size: 'sm' | 'md' = 'sm') => {
    const className = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    switch (status) {
      case 'in_progress':
        return <Play className={`${className} text-yellow-400`} />;
      case 'completed':
        return <CheckCircle className={`${className} text-green-400`} />;
      case 'cancelled':
        return <XCircle className={`${className} text-red-400`} />;
      case 'scheduled':
        return <Clock className={`${className} text-blue-400`} />;
      default:
        return <Clock className={`${className} text-gray-400`} />;
    }
  };

  const getRoundColor = (round: number) => {
    const colors = [
      'text-blue-400',
      'text-purple-400',
      'text-pink-400',
      'text-amber-400',
      'text-green-400',
      'text-cyan-400',
    ];
    return colors[(round - 1) % colors.length];
  };

  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

  const formatScheduledTime = (time?: number) => {
    if (!time) return null;
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow =
      new Date(now.getTime() + MILLISECONDS_PER_DAY).toDateString() === date.toDateString();

    if (isToday) return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/tournaments">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              {tournament.is_official && (
                <Sparkles className="h-6 w-6 text-amber-400" />
              )}
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              {!tournament.is_official &&
                creatorProfile &&
                (tournament.status === 'in_progress' ||
                  tournament.status === 'completed') && (
                  <TooltipProvider>
                    <Tooltip open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                      <TooltipTrigger asChild>
                        <span
                          className="text-muted-foreground inline-flex items-center gap-1 cursor-help"
                          onClick={() => setIsInfoOpen((prev) => !prev)}
                        >
                          <Info className="h-4 w-4" />
                          Info
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <div className="text-xs">
                          <span className="block">
                            Created by {creatorProfile.first_name}{' '}
                            {creatorProfile.last_name}
                          </span>
                          <span className="text-muted-foreground">
                            {creatorProfile.institution}
                            {creatorProfile.team?.team_name
                              ? ` • ${creatorProfile.team.team_name}`
                              : ''}
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${statusInfo.color} bg-white/5`}>
                {statusInfo.name}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {formatInfo.name}
              </Badge>
              {tournament.status !== 'registration' && (
                <span className="text-muted-foreground">
                  {tournament.participant_count} / {tournament.max_teams} teams
                </span>
              )}
              {hasMatches && (
                <span className="text-muted-foreground">
                  • {totalRounds} rounds
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {tournament.status === 'registration' && (
            <>
              {isRegistered ? (
                <Button
                  variant="outline"
                  onClick={handleLeave}
                  disabled={actionLoading === 'leave'}
                >
                  {actionLoading === 'leave' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleJoin} disabled={actionLoading === 'join'}>
                  {actionLoading === 'join' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Join Tournament
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          {canManage && tournament.status === 'registration' && (
            <Button
              onClick={handleStart}
              disabled={
                actionLoading === 'start' ||
                tournament.participant_count < tournament.min_teams
              }
            >
              {actionLoading === 'start' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          )}
          {canManage &&
            tournament.status !== 'completed' &&
            tournament.status !== 'cancelled' && (
              <Button
                variant="outline"
                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                onClick={handleCancel}
                disabled={actionLoading === 'cancel'}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* My Schedule Banner (if user's team is in tournament) */}
      {userTeamId && myTeamMatches.length > 0 && hasMatches && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Your Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.team?.team_name} • {myTeamMatches.length} matches
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {myTeamMatches.map((match) => {
                const isTeam1 = match.team1_id === userTeamId;
                const opponentName = isTeam1 ? match.team2_name : match.team1_name;
                const teamScore = isTeam1 ? match.team1_games_won : match.team2_games_won;
                const oppScore = isTeam1 ? match.team2_games_won : match.team1_games_won;
                const isWinner = match.winner_team_id === userTeamId;
                const isLoser = match.winner_team_id && match.winner_team_id !== userTeamId;

                return (
                  <Link
                    key={match._id}
                    href={`/dashboard/tournaments/${tournamentId}/matches/${match._id}`}
                  >
                    <div
                      className={`p-3 rounded-lg border transition-all cursor-pointer hover:scale-[1.02] ${
                        isWinner
                          ? 'bg-green-500/10 border-green-500/30'
                          : isLoser
                            ? 'bg-red-500/10 border-red-500/30'
                            : match.status === 'in_progress'
                              ? 'bg-yellow-500/10 border-yellow-500/30 animate-pulse'
                              : 'bg-secondary/30 border-primary/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-xs ${getRoundColor(match.round)}`}>
                          R{match.round}
                        </Badge>
                        {getStatusIcon(match.status)}
                      </div>
                      <p className="font-medium text-white text-sm truncate mb-1">
                        vs {opponentName ?? 'TBD'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">
                          {teamScore} - {oppScore}
                        </span>
                        {match.scheduled_time && (
                          <span className="text-xs text-muted-foreground">
                            {formatScheduledTime(match.scheduled_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Info Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tournament.status !== 'registration' && (
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Teams</p>
                  <p className="font-bold text-white">{tournament.participant_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {tournament.status !== 'registration' && (
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Swords className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Matches</p>
                  <p className="font-bold text-white">{bracket?.length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {tournament.status !== 'registration' && (
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-bold text-white">
                    {bracket?.filter((m) => m.status === 'completed').length ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Format</p>
                <p className="font-bold text-white">
                  {tournament.games_per_match === 1
                    ? 'Single'
                    : `Bo${tournament.games_per_match * 2 - 1}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {tournament.status === 'registration' ? 'Starts' : 'Started'}
                </p>
                <p className="font-bold text-white text-sm">
                  {tournament.start_time
                    ? new Date(tournament.start_time).toLocaleDateString()
                    : 'TBD'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {(tournament.status === 'in_progress' || tournament.status === 'completed') &&
      hasMatches ? (
        <>
          {/* View Switcher */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Round Robin Bracket</h2>
            <div className="flex items-center gap-1 p-1 bg-secondary/30 rounded-lg">
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('matrix')}
                className={viewMode !== 'matrix' ? 'text-muted-foreground' : ''}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Matrix
              </Button>
              <Button
                variant={viewMode === 'schedule' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('schedule')}
                className={viewMode !== 'schedule' ? 'text-muted-foreground' : ''}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Schedule
              </Button>
              <Button
                variant={viewMode === 'teams' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('teams')}
                className={viewMode !== 'teams' ? 'text-muted-foreground' : ''}
              >
                <Users className="h-4 w-4 mr-1" />
                Teams
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Standings */}
            <Card className="border-primary/10 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Standings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {standings?.map((team, index) => (
                  <motion.div
                    key={team.team_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                      selectedTeamId === team.team_id
                        ? 'bg-primary/20 border border-primary/30'
                        : team.team_id === userTeamId
                          ? 'bg-primary/10 border border-primary/20'
                          : index < 3
                            ? 'bg-primary/5 hover:bg-primary/10'
                            : 'bg-secondary/30 hover:bg-secondary/50'
                    }`}
                    onClick={() =>
                      setSelectedTeamId(
                        selectedTeamId === team.team_id ? null : team.team_id
                      )
                    }
                  >
                    <div className="w-10 text-center">{getRankBadge(index + 1)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">
                          {team.team_name}
                        </p>
                        {team.team_id === userTeamId && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-green-400">{team.matches_won}W</span>
                        <span className="text-red-400">{team.matches_lost}L</span>
                        <span className="text-slate-300">{team.matches_tied}T</span>
                        <span className="text-muted-foreground">{team.matches_pending}P</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-400">{team.points}</p>
                      <p className="text-xs text-muted-foreground">pts</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Main View Area */}
            <Card className="border-primary/10 lg:col-span-2">
              <CardContent className="pt-6">
                <AnimatePresence mode="wait">
                  {/* Matrix View */}
                  {viewMode === 'matrix' && matchMatrix && participants && (
                    <motion.div
                      key="matrix"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="overflow-x-auto"
                    >
                      <div className="min-w-max">
                        {/* Header Row */}
                        <div className="flex">
                          <div className="w-32 h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">
                            vs
                          </div>
                          {participants.map((team) => (
                            <div
                              key={team.team_id}
                              className={`w-28 h-12 flex items-center justify-center text-xs font-medium px-1 text-center transition-all ${
                                selectedTeamId === team.team_id
                                  ? 'text-primary bg-primary/10 rounded-t-lg'
                                  : team.team_id === userTeamId
                                    ? 'text-primary/80'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {team.team_name.length > 10
                                ? team.team_name.slice(0, 8) + '...'
                                : team.team_name}
                            </div>
                          ))}
                        </div>
                        {/* Matrix Rows */}
                        {participants.map((rowTeam) => (
                          <div key={rowTeam.team_id} className="flex">
                            <div
                              className={`w-32 h-20 flex items-center px-3 text-sm font-medium transition-all ${
                                selectedTeamId === rowTeam.team_id
                                  ? 'text-primary bg-primary/10'
                                  : rowTeam.team_id === userTeamId
                                    ? 'text-primary/80 bg-primary/5'
                                    : 'text-white'
                              }`}
                            >
                              <span className="truncate">{rowTeam.team_name}</span>
                            </div>
                            {participants.map((colTeam) => {
                              if (rowTeam.team_id === colTeam.team_id) {
                                return (
                                  <div
                                    key={colTeam.team_id}
                                    className="w-28 h-20 flex items-center justify-center bg-secondary/10"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                                      <X className="h-4 w-4 text-muted-foreground/30" />
                                    </div>
                                  </div>
                                );
                              }

                              const matchup = matchMatrix[rowTeam.team_id]?.[colTeam.team_id];
                              const isHighlighted =
                                selectedTeamId === rowTeam.team_id ||
                                selectedTeamId === colTeam.team_id;
                              const isMyMatch =
                                rowTeam.team_id === userTeamId || colTeam.team_id === userTeamId;

                              return (
                                <Link
                                  key={colTeam.team_id}
                                  href={
                                    matchup
                                      ? `/dashboard/tournaments/${tournamentId}/matches/${matchup.matchId}`
                                      : '#'
                                  }
                                  className={!matchup ? 'pointer-events-none' : ''}
                                >
                                  <div
                                    className={`w-28 h-20 flex flex-col items-center justify-center border transition-all cursor-pointer hover:scale-105 ${getMatchCellStyle(matchup)} ${
                                      isHighlighted
                                        ? 'ring-2 ring-primary/50'
                                        : isMyMatch
                                          ? 'ring-1 ring-primary/30'
                                          : ''
                                    }`}
                                  >
                                    {matchup ? (
                                      <>
                                        {/* Round Badge */}
                                        <div
                                          className={`text-[10px] font-bold mb-1 ${getRoundColor(matchup.round)}`}
                                        >
                                          R{matchup.round}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {getStatusIcon(matchup.status)}
                                          <span className="text-lg font-bold text-white">
                                            {matchup.team1GamesWon} - {matchup.team2GamesWon}
                                          </span>
                                        </div>
                                        {matchup.scheduledTime && matchup.status !== 'completed' && (
                                          <div className="text-[9px] text-muted-foreground mt-1">
                                            {formatScheduledTime(matchup.scheduledTime)}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">N/A</span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-primary/10 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                          <span>Win</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
                          <span>Loss</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30" />
                          <span>Tie</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30" />
                          <span>Live</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20" />
                          <span>Scheduled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-secondary/30 border border-secondary/50" />
                          <span>Pending</span>
                        </div>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="text-blue-400">R1</span>
                        <span className="text-purple-400">R2</span>
                        <span className="text-pink-400">R3</span>
                        <span>= Round numbers</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Rounds View */}
                  {viewMode === 'rounds' && (
                    <motion.div
                      key="rounds"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {Object.entries(matchesByRound)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([round, matches]) => {
                          const completedCount =
                            matches?.filter((m) => m.status === 'completed').length ?? 0;
                          const inProgressCount =
                            matches?.filter((m) => m.status === 'in_progress').length ?? 0;

                          return (
                            <div key={round}>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                      inProgressCount > 0
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : completedCount === matches?.length
                                          ? 'bg-green-500/20 text-green-400'
                                          : 'bg-primary/10 text-primary'
                                    }`}
                                  >
                                    {round}
                                  </div>
                                  Round {round}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="text-green-400">{completedCount}</span>
                                  <span>/</span>
                                  <span>{matches?.length}</span>
                                  <span>completed</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {matches?.map((match) => {
                                  const statusInfo = TOURNAMENT_MATCH_STATUSES[match.status];
                                  const isMyMatch =
                                    match.team1_id === userTeamId || match.team2_id === userTeamId;

                                  return (
                                    <Link
                                      key={match._id}
                                      href={`/dashboard/tournaments/${tournamentId}/matches/${match._id}`}
                                    >
                                      <div
                                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
                                          match.status === 'completed'
                                            ? 'bg-secondary/30 border-primary/10 hover:border-primary/30'
                                            : match.status === 'in_progress'
                                              ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                                              : match.status === 'scheduled'
                                                ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
                                                : 'bg-secondary/20 border-secondary/30 hover:border-primary/20'
                                        } ${isMyMatch ? 'ring-1 ring-primary/40' : ''}`}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            {getStatusIcon(match.status)}
                                            <span className={`text-sm font-medium ${statusInfo.color}`}>
                                              {statusInfo.name}
                                            </span>
                                          </div>
                                          {match.scheduled_time && (
                                            <span className="text-xs text-muted-foreground">
                                              {formatScheduledTime(match.scheduled_time)}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p
                                              className={`font-semibold ${
                                                match.winner_team_id === match.team1_id
                                                  ? 'text-green-400'
                                                  : 'text-white'
                                              } ${match.team1_id === userTeamId ? 'text-primary' : ''}`}
                                            >
                                              {match.team1_name ?? 'TBD'}
                                              {match.team1_id === userTeamId && (
                                                <span className="text-[10px] ml-1 text-primary">(You)</span>
                                              )}
                                            </p>
                                          </div>
                                          <div className="px-6">
                                            <p className="text-2xl font-bold text-white">
                                              {match.team1_games_won} - {match.team2_games_won}
                                            </p>
                                          </div>
                                          <div className="flex-1 text-right">
                                            <p
                                              className={`font-semibold ${
                                                match.winner_team_id === match.team2_id
                                                  ? 'text-green-400'
                                                  : 'text-white'
                                              } ${match.team2_id === userTeamId ? 'text-primary' : ''}`}
                                            >
                                              {match.team2_name ?? 'TBD'}
                                              {match.team2_id === userTeamId && (
                                                <span className="text-[10px] ml-1 text-primary">(You)</span>
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </motion.div>
                  )}

                  {/* Schedule View */}
                  {viewMode === 'schedule' && (
                    <motion.div
                      key="schedule"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4 pb-4 border-b border-primary/10">
                        <div className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-white">Full Tournament Schedule</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{totalRounds} rounds</span>
                          <span>•</span>
                          <span>{sortedMatches.length} matches</span>
                        </div>
                      </div>

                      {Object.entries(matchesByRound)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([round, matches]) => {
                          const completedCount =
                            matches?.filter((m) => m.status === 'completed').length ?? 0;
                          const inProgressCount =
                            matches?.filter((m) => m.status === 'in_progress').length ?? 0;

                          return (
                            <div key={round}>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                      inProgressCount > 0
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : completedCount === matches?.length
                                          ? 'bg-green-500/20 text-green-400'
                                          : 'bg-primary/10 text-primary'
                                    }`}
                                  >
                                    {round}
                                  </div>
                                  Round {round}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="text-green-400">{completedCount}</span>
                                  <span>/</span>
                                  <span>{matches?.length}</span>
                                  <span>completed</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {matches?.map((match) => {
                                  const statusInfo = TOURNAMENT_MATCH_STATUSES[match.status];
                                  const isMyMatch =
                                    match.team1_id === userTeamId || match.team2_id === userTeamId;

                                  return (
                                    <Link
                                      key={match._id}
                                      href={`/dashboard/tournaments/${tournamentId}/matches/${match._id}`}
                                    >
                                      <div
                                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
                                          match.status === 'completed'
                                            ? 'bg-secondary/30 border-primary/10 hover:border-primary/30'
                                            : match.status === 'in_progress'
                                              ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                                              : match.status === 'scheduled'
                                                ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
                                                : 'bg-secondary/20 border-secondary/30 hover:border-primary/20'
                                        } ${isMyMatch ? 'ring-1 ring-primary/40' : ''}`}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            {getStatusIcon(match.status)}
                                            <span className={`text-sm font-medium ${statusInfo.color}`}>
                                              {statusInfo.name}
                                            </span>
                                          </div>
                                          {match.scheduled_time && (
                                            <span className="text-xs text-muted-foreground">
                                              {formatScheduledTime(match.scheduled_time)}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <p
                                              className={`font-semibold ${
                                                match.winner_team_id === match.team1_id
                                                  ? 'text-green-400'
                                                  : 'text-white'
                                              } ${match.team1_id === userTeamId ? 'text-primary' : ''}`}
                                            >
                                              {match.team1_name ?? 'TBD'}
                                              {match.team1_id === userTeamId && (
                                                <span className="text-[10px] ml-1 text-primary">(You)</span>
                                              )}
                                            </p>
                                          </div>
                                          <div className="px-6">
                                            <p className="text-2xl font-bold text-white">
                                              {match.team1_games_won} - {match.team2_games_won}
                                            </p>
                                          </div>
                                          <div className="flex-1 text-right">
                                            <p
                                              className={`font-semibold ${
                                                match.winner_team_id === match.team2_id
                                                  ? 'text-green-400'
                                                  : 'text-white'
                                              } ${match.team2_id === userTeamId ? 'text-primary' : ''}`}
                                            >
                                              {match.team2_name ?? 'TBD'}
                                              {match.team2_id === userTeamId && (
                                                <span className="text-[10px] ml-1 text-primary">(You)</span>
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </motion.div>
                  )}

                  {/* Teams View */}
                  {viewMode === 'teams' && participants && (
                    <motion.div
                      key="teams"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {participants.map((team, idx) => {
                        const teamMatches = matchesByTeam[team.team_id] ?? [];
                        const standing = standings?.find((s) => s.team_id === team.team_id);
                        const isMyTeam = team.team_id === userTeamId;

                        return (
                          <div
                            key={team.team_id}
                            className={`border rounded-xl overflow-hidden ${
                              isMyTeam ? 'border-primary/30' : 'border-primary/10'
                            }`}
                          >
                            <div
                              className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                                selectedTeamId === team.team_id
                                  ? 'bg-primary/10'
                                  : isMyTeam
                                    ? 'bg-primary/5 hover:bg-primary/10'
                                    : 'bg-secondary/20 hover:bg-secondary/30'
                              }`}
                              onClick={() =>
                                setSelectedTeamId(
                                  selectedTeamId === team.team_id ? null : team.team_id
                                )
                              }
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 text-center">{getRankBadge(idx + 1)}</div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-white text-lg">{team.team_name}</p>
                                    {isMyTeam && (
                                      <Badge className="bg-primary/20 text-primary border-0">
                                        Your Team
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">ELO: {team.team_elo}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-green-400">
                                    {standing?.matches_won ?? 0}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Wins</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-red-400">
                                    {standing?.matches_lost ?? 0}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Losses</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-slate-300">
                                    {standing?.matches_tied ?? 0}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Ties</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-amber-400">
                                    {standing?.points ?? 0}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Points</p>
                                </div>
                                <ChevronRight
                                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                                    selectedTeamId === team.team_id ? 'rotate-90' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            <AnimatePresence>
                              {selectedTeamId === team.team_id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-2 border-t border-primary/10">
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {teamMatches.length} matches • Sorted by round
                                    </p>
                                    <div className="space-y-2">
                                      {teamMatches.map((match) => {
                                        const isTeam1 = match.team1_id === team.team_id;
                                        const opponentName = isTeam1
                                          ? match.team2_name
                                          : match.team1_name;
                                        const teamScore = isTeam1
                                          ? match.team1_games_won
                                          : match.team2_games_won;
                                        const oppScore = isTeam1
                                          ? match.team2_games_won
                                          : match.team1_games_won;
                                        const isWinner = match.winner_team_id === team.team_id;
                                        const isLoser =
                                          match.winner_team_id &&
                                          match.winner_team_id !== team.team_id;

                                        return (
                                          <Link
                                            key={match._id}
                                            href={`/dashboard/tournaments/${tournamentId}/matches/${match._id}`}
                                          >
                                            <div
                                              className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                                                isWinner
                                                  ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20'
                                                  : isLoser
                                                    ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
                                                    : match.status === 'in_progress'
                                                      ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20'
                                                      : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <Badge
                                                  variant="outline"
                                                  className={`${getRoundColor(match.round)}`}
                                                >
                                                  R{match.round}
                                                </Badge>
                                                {getStatusIcon(match.status)}
                                                <div>
                                                  <p className="font-medium text-white">
                                                    vs {opponentName ?? 'TBD'}
                                                  </p>
                                                  {match.scheduled_time && (
                                                    <p className="text-xs text-muted-foreground">
                                                      {formatScheduledTime(match.scheduled_time)}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                  <p className="text-lg font-bold text-white">
                                                    {teamScore} - {oppScore}
                                                  </p>
                                                  <p
                                                    className={`text-xs ${TOURNAMENT_MATCH_STATUSES[match.status].color}`}
                                                  >
                                                    {TOURNAMENT_MATCH_STATUSES[match.status].name}
                                                  </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            </div>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Registration Phase or No Matches */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description */}
          <Card className="border-primary/10 lg:col-span-2">
            <CardHeader>
              <CardTitle>About This Tournament</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{tournament.description}</p>

              {!tournament.is_official &&
                creatorProfile &&
                (tournament.status === 'registration' ||
                  tournament.status === 'cancelled') && (
                  <div className="mb-6 text-sm text-muted-foreground">
                    <span className="block">Created by</span>
                    <span className="text-white">
                      {creatorProfile.first_name} {creatorProfile.last_name}
                    </span>
                    <span>
                      {creatorProfile.institution
                        ? ` • ${creatorProfile.institution}`
                        : ''}
                      {creatorProfile.team?.team_name
                        ? ` • ${creatorProfile.team.team_name}`
                        : ''}
                    </span>
                  </div>
                )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Swords className="h-4 w-4" />
                    <span>Format</span>
                  </div>
                  <p className="font-semibold text-white">{formatInfo.name}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Games/Match</span>
                  </div>
                  <p className="font-semibold text-white">
                    {tournament.games_per_match === 1
                      ? 'Single Game'
                      : `Best of ${tournament.games_per_match * 2 - 1}`}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline</span>
                  </div>
                  <p className="font-semibold text-white">
                    {tournament.registration_deadline
                      ? new Date(tournament.registration_deadline).toLocaleDateString()
                      : 'TBD'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>Start</span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-white"
                            aria-label="Start timing info"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <p className="text-xs">
                            Organizer can start the tournament before this date.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="font-semibold text-white">
                    {tournament.start_time
                      ? new Date(tournament.start_time).toLocaleDateString()
                      : 'TBD'}
                  </p>
                </div>
              </div>

              {canManage &&
                tournament.status === 'registration' &&
                tournament.participant_count < tournament.min_teams && (
                  <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-400 text-sm">
                      <strong>
                        {tournament.min_teams - tournament.participant_count} more team(s) needed
                      </strong>{' '}
                      to start this tournament.
                    </p>
                  </div>
                )}

            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Registered Teams</span>
                <Badge variant="outline">
                  {tournament.participant_count} / {tournament.max_teams}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants && participants.length > 0 ? (
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div
                      key={participant._id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        participant.team_id === userTeamId
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-secondary/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {participant.team_name}
                          </p>
                          {participant.team_id === userTeamId && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ELO: {participant.team_elo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No teams registered yet</p>
                </div>
              )}

              {/* Registration Progress */}
              {tournament.status === 'registration' && (
                <div className="mt-4 pt-4 border-t border-primary/10">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>
                      {tournament.participant_count} / {tournament.max_teams} teams
                    </span>
                    <span>
                      {Math.round(
                        (tournament.participant_count / tournament.max_teams) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${(tournament.participant_count / tournament.max_teams) * 100}%`,
                      }}
                    />
                  </div>
                  {tournament.participant_count >= tournament.min_teams && (
                    <p className="text-xs text-green-400 mt-2">✓ Minimum teams reached</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
