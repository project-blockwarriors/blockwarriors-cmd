'use client';

import { useState, useMemo } from 'react';
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
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  TOURNAMENT_MATCH_STATUSES,
  getMaxGamesInMatch,
} from '@/lib/tournament-constants';
import { authClient } from '@/lib/auth-client';

export default function TournamentMatchPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const matchId = params.matchId as string;
  const { data: session } = authClient.useSession();

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userProfile = useQuery(
    api.userProfiles.getUserProfile,
    session?.user?.id ? { userId: session.user.id } : 'skip'
  );

  const userTeamId = userProfile?.team?.id;

  // Fetch tournament match
  const tournamentMatch = useQuery(
    api.tournamentMatches.getTournamentMatch,
    matchId ? { matchId: matchId as Id<'tournament_matches'> } : 'skip'
  );

  const tournamentBracket = useQuery(
    api.tournamentMatches.getTournamentBracket,
    tournamentMatch?.tournament_id
      ? { tournamentId: tournamentMatch.tournament_id }
      : 'skip'
  );

  // Fetch game matches for this tournament match
  const gameMatches = useQuery(
    api.matches.getMatches,
    tournamentMatch?.games && tournamentMatch.games.length > 0
      ? { matchIds: tournamentMatch.games }
      : 'skip'
  );

  // Mutations
  const createTournamentGame = useMutation(
    api.tournamentMatches.createTournamentGame
  );
  const handleCreateGame = async () => {
    if (!session?.user?.id || !tournamentMatch) return;
    setActionLoading(true);
    setError(null);

    try {
      const result = await createTournamentGame({
        tournamentMatchId: matchId as Id<'tournament_matches'>,
        matchType: 'pvp', // Default to PvP, could be configurable
        mode: 'ranked', // Tournament matches are ranked
        userId: session.user.id,
      });

      if (!result.success) {
        setError(result.error ?? 'Failed to create game');
      } else if (result.matchId) {
        // Redirect to the game match page
        router.push(`/dashboard/matches/${result.matchId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setActionLoading(false);
    }
  };

  const isUserTeamInMatch =
    Boolean(userTeamId) &&
    (tournamentMatch?.team1_id === userTeamId ||
      tournamentMatch?.team2_id === userTeamId);
  const hasIncompletePriorRound = useMemo(() => {
    if (!tournamentMatch || !tournamentBracket) return false;
    if (tournamentMatch.round <= 1) return false;
    const priorRound = tournamentMatch.round - 1;
    const priorRoundMatches = tournamentBracket.filter(
      (match) =>
        match.round === priorRound &&
        (match.team1_id === tournamentMatch.team1_id ||
          match.team2_id === tournamentMatch.team1_id ||
          match.team1_id === tournamentMatch.team2_id ||
          match.team2_id === tournamentMatch.team2_id)
    );
    if (priorRoundMatches.length === 0) return false;
    return priorRoundMatches.some((match) => match.status !== 'completed');
  }, [tournamentBracket, tournamentMatch]);
  const hasActiveGame = useMemo(() => {
    if (!tournamentMatch || !gameMatches) return false;
    return tournamentMatch.games.some((gameId) => {
      const game = gameMatches[gameId];
      return (
        game &&
        game.match_status !== 'Finished' &&
        game.match_status !== 'Terminated'
      );
    });
  }, [gameMatches, tournamentMatch]);

  // Loading state
  if (tournamentMatch === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Not found
  if (tournamentMatch === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <TrophyIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Match Not Found</h1>
          <p className="text-gray-400 mb-4">
            This match doesn&apos;t exist or has been removed.
          </p>
          <Link href={`/dashboard/tournaments/${tournamentId}`}>
            <Button>Back to Tournament</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = TOURNAMENT_MATCH_STATUSES[tournamentMatch.status];
  const maxGames = getMaxGamesInMatch(tournamentMatch.games_required);
  const totalGamesPlayed = tournamentMatch.games.length;
  const canCreateGame =
    tournamentMatch.status !== 'completed' &&
    tournamentMatch.status !== 'cancelled' &&
    totalGamesPlayed < maxGames &&
    tournamentMatch.team1_games_won < tournamentMatch.games_required &&
    tournamentMatch.team2_games_won < tournamentMatch.games_required &&
    !hasIncompletePriorRound &&
    !hasActiveGame &&
    isUserTeamInMatch;
  const shouldShowStartButton = canCreateGame;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/tournaments/${tournamentId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <p className="text-sm text-gray-400">
            {tournamentMatch.tournament_name} • Round {tournamentMatch.round}
          </p>
          <h1 className="text-2xl font-bold text-white">
            Match #{tournamentMatch.match_number + 1}
          </h1>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {hasIncompletePriorRound && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <p className="text-amber-400 text-sm">
            Round {tournamentMatch.round - 1} must be completed before this game can start.
          </p>
        </div>
      )}

      {/* Match Card */}
      <div className="bg-black/40 backdrop-blur-md rounded-lg p-8 border border-white/10 mb-6">
        {/* Status */}
        <div className="flex justify-center mb-6">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} bg-white/5`}
          >
            {statusInfo.name}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <div
              className={`text-2xl font-bold mb-2 ${
                tournamentMatch.winner_team_id === tournamentMatch.team1_id
                  ? 'text-green-400'
                  : 'text-white'
              }`}
            >
              {tournamentMatch.team1_name ?? 'TBD'}
            </div>
            {tournamentMatch.winner_team_id === tournamentMatch.team1_id && (
              <div className="flex items-center justify-center gap-1 text-green-400 text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                Winner
              </div>
            )}
          </div>

          {/* Score */}
          <div className="px-8">
            <div className="text-5xl font-bold text-white">
              {tournamentMatch.team1_games_won} -{' '}
              {tournamentMatch.team2_games_won}
            </div>
            <p className="text-center text-gray-400 text-sm mt-2">
              Best of {maxGames}
            </p>
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <div
              className={`text-2xl font-bold mb-2 ${
                tournamentMatch.winner_team_id === tournamentMatch.team2_id
                  ? 'text-green-400'
                  : 'text-white'
              }`}
            >
              {tournamentMatch.team2_name ?? 'TBD'}
            </div>
            {tournamentMatch.winner_team_id === tournamentMatch.team2_id && (
              <div className="flex items-center justify-center gap-1 text-green-400 text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                Winner
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Time */}
        {tournamentMatch.scheduled_time && (
          <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
            <ClockIcon className="w-4 h-4" />
            <span className="text-sm">
              Scheduled:{' '}
              {new Date(tournamentMatch.scheduled_time).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Games List */}
      <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Games ({totalGamesPlayed} / {maxGames})
          </h2>
          {shouldShowStartButton && (
            <Button
              onClick={handleCreateGame}
              disabled={actionLoading}
              size="sm"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <PlayIcon className="w-4 h-4 mr-2" />
                  {`Start Game ${totalGamesPlayed + 1}`}
                </>
              )}
            </Button>
          )}
        </div>

        {tournamentMatch.games.length > 0 ? (
          <div className="space-y-3">
            {tournamentMatch.games.map((gameId, index) => {
              const game = gameMatches?.[gameId];
              return (
                <Link
                  key={gameId}
                  href={`/dashboard/matches/${gameId}?tournamentId=${tournamentId}&tournamentMatchId=${matchId}`}
                >
                  <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          Game {index + 1}
                        </p>
                        {game && (
                          <p className="text-sm text-gray-400 capitalize">
                            Status: {game.match_status}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {game?.match_type ?? 'Loading...'}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No games played yet</p>
            {canCreateGame && (
              <p className="text-sm text-gray-500 mt-2">
                Click &quot;Start Game&quot; to begin the first game
              </p>
            )}
          </div>
        )}
      </div>

      {/* Match Info */}
      <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">Match Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Tournament</p>
            <p className="text-white">{tournamentMatch.tournament_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Format</p>
            <p className="text-white capitalize">
              {tournamentMatch.tournament_format.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Round</p>
            <p className="text-white">{tournamentMatch.round}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Games to Win</p>
            <p className="text-white">{tournamentMatch.games_required}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
