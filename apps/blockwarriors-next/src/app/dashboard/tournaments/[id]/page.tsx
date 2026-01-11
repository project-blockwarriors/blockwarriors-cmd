'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/convex';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  TrophyIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  SparklesIcon,
  PlayIcon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  TOURNAMENT_STATUSES,
  TOURNAMENT_FORMATS,
  TOURNAMENT_MATCH_STATUSES,
} from '@/lib/tournament-constants';
import { authClient } from '@/lib/auth-client';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const { data: session } = authClient.useSession();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournament data
  const tournament = useQuery(
    api.tournaments.getTournament,
    tournamentId ? { tournamentId: tournamentId as Id<'tournaments'> } : 'skip'
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Not found
  if (tournament === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <TrophyIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Tournament Not Found
          </h1>
          <p className="text-gray-400 mb-4">
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
  const canManage = isCreator; // TODO: Add admin check
  const statusInfo = TOURNAMENT_STATUSES[tournament.status];
  const formatInfo = TOURNAMENT_FORMATS[tournament.format];

  // Group matches by round
  const matchesByRound: Record<number, typeof bracket> = {};
  if (bracket) {
    for (const match of bracket) {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round]!.push(match);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/tournaments">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {tournament.is_official && (
              <SparklesIcon className="w-6 h-6 text-amber-400" />
            )}
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} bg-white/5`}
            >
              {statusInfo.name}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-400 bg-white/5">
              {formatInfo.name}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-3">About</h2>
            <p className="text-gray-400">{tournament.description}</p>
          </div>

          {/* Standings (for in_progress or completed) */}
          {(tournament.status === 'in_progress' ||
            tournament.status === 'completed') &&
            standings &&
            standings.length > 0 && (
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Standings
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                        <th className="pb-3 pr-4">#</th>
                        <th className="pb-3 pr-4">Team</th>
                        <th className="pb-3 pr-4 text-center">W</th>
                        <th className="pb-3 pr-4 text-center">L</th>
                        <th className="pb-3 pr-4 text-center">GW</th>
                        <th className="pb-3 pr-4 text-center">GL</th>
                        <th className="pb-3 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team, index) => (
                        <tr
                          key={team.team_id}
                          className="border-b border-white/5 text-sm"
                        >
                          <td className="py-3 pr-4 text-gray-400">
                            {index + 1}
                          </td>
                          <td className="py-3 pr-4 text-white font-medium">
                            {team.team_name}
                          </td>
                          <td className="py-3 pr-4 text-center text-green-400">
                            {team.matches_won}
                          </td>
                          <td className="py-3 pr-4 text-center text-red-400">
                            {team.matches_lost}
                          </td>
                          <td className="py-3 pr-4 text-center text-gray-400">
                            {team.games_won}
                          </td>
                          <td className="py-3 pr-4 text-center text-gray-400">
                            {team.games_lost}
                          </td>
                          <td className="py-3 text-center text-amber-400 font-semibold">
                            {team.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Matches (for in_progress or completed) */}
          {(tournament.status === 'in_progress' ||
            tournament.status === 'completed') &&
            bracket &&
            bracket.length > 0 && (
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Schedule
                </h2>
                <div className="space-y-6">
                  {Object.entries(matchesByRound)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([round, matches]) => (
                      <div key={round}>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">
                          Round {round}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {matches?.map((match) => {
                            const matchStatusInfo =
                              TOURNAMENT_MATCH_STATUSES[match.status];
                            return (
                              <Link
                                key={match._id}
                                href={`/dashboard/tournaments/${tournamentId}/matches/${match._id}`}
                              >
                                <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                                  <div className="flex items-center justify-between mb-2">
                                    <span
                                      className={`text-xs font-medium ${matchStatusInfo.color}`}
                                    >
                                      {matchStatusInfo.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Match #{match.match_number + 1}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p
                                        className={`font-medium ${
                                          match.winner_team_id === match.team1_id
                                            ? 'text-green-400'
                                            : 'text-white'
                                        }`}
                                      >
                                        {match.team1_name ?? 'TBD'}
                                      </p>
                                    </div>
                                    <div className="px-4 text-center">
                                      <span className="text-lg font-bold text-white">
                                        {match.team1_games_won} -{' '}
                                        {match.team2_games_won}
                                      </span>
                                    </div>
                                    <div className="flex-1 text-right">
                                      <p
                                        className={`font-medium ${
                                          match.winner_team_id === match.team2_id
                                            ? 'text-green-400'
                                            : 'text-white'
                                        }`}
                                      >
                                        {match.team2_name ?? 'TBD'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Participants */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">
              Participants ({tournament.participant_count} / {tournament.max_teams})
            </h2>
            {participants && participants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {participants.map((participant, index) => (
                  <div
                    key={participant._id}
                    className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {participant.team_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        ELO: {participant.team_elo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No teams registered yet
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              {/* Join/Leave for registration phase */}
              {tournament.status === 'registration' && (
                <>
                  {isRegistered ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLeave}
                      disabled={actionLoading === 'leave'}
                    >
                      {actionLoading === 'leave' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-2" />
                          Leave Tournament
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleJoin}
                      disabled={actionLoading === 'join'}
                    >
                      {actionLoading === 'join' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <UserGroupIcon className="w-4 h-4 mr-2" />
                          Join Tournament
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}

              {/* Admin/Creator Actions */}
              {canManage && tournament.status === 'registration' && (
                <>
                  <Button
                    className="w-full"
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
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Start Tournament
                      </>
                    )}
                  </Button>
                  {tournament.participant_count < tournament.min_teams && (
                    <p className="text-xs text-gray-400 text-center">
                      Need {tournament.min_teams - tournament.participant_count}{' '}
                      more team(s) to start
                    </p>
                  )}
                </>
              )}

              {canManage && tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                >
                  {actionLoading === 'cancel' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                  ) : (
                    <>
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Cancel Tournament
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Format</p>
                <p className="text-white">{formatInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Games per Match</p>
                <p className="text-white">
                  {tournament.games_per_match === 1
                    ? 'Single Game'
                    : `Best of ${tournament.games_per_match * 2 - 1}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Team Limits</p>
                <p className="text-white">
                  {tournament.min_teams} - {tournament.max_teams} teams
                </p>
              </div>
              {tournament.registration_deadline && (
                <div>
                  <p className="text-sm text-gray-400">Registration Deadline</p>
                  <p className="text-white">
                    {new Date(tournament.registration_deadline).toLocaleString()}
                  </p>
                </div>
              )}
              {tournament.start_time && (
                <div>
                  <p className="text-sm text-gray-400">Start Time</p>
                  <p className="text-white">
                    {new Date(tournament.start_time).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white">
                  {new Date(tournament.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
