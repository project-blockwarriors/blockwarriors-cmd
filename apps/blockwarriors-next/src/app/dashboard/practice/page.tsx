'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ServerIcon,
  PlayIcon,
  UsersIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { GAME_TYPES, type GameType } from '@/lib/match-constants';
import { startMatch } from '@/server/actions/matches';
import { api } from '@/lib/convex';
import { Id } from '@packages/backend/convex/_generated/dataModel';

interface ServerStatus {
  activeSessions: number;
  playersOnline: number;
  serverLoad: number;
}

export default function PracticePage() {
  const router = useRouter();
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [serverStatus] = useState<ServerStatus>({
    activeSessions: 0,
    playersOnline: 0,
    serverLoad: 0,
  });

  const [matchId, setMatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to match updates with tokens and IGNs (real-time)
  const matchData = useQuery(
    api.matches.getMatchWithTokens,
    matchId ? { matchId: matchId as Id<'matches'> } : 'skip'
  );

  // Redirect to match detail page when server starts the match
  useEffect(() => {
    if (matchData?.match_status === 'Playing' && matchId) {
      router.push(`/dashboard/matches/${matchId}`);
    }
  }, [matchData?.match_status, matchId, router]);

  const hasTokens =
    matchData?.tokens &&
    (matchData.tokens.redTeam.length > 0 ||
      matchData.tokens.blueTeam.length > 0);

  const waitingForTokens =
    matchId && matchData?.match_status === 'Queuing' && !hasTokens;

  const allPlayersReady =
    matchData &&
    matchData.totalTokens > 0 &&
    matchData.usedTokens === matchData.totalTokens;

  const isButtonDisabled = Boolean(
    !selectedGameType ||
      isLoading ||
      waitingForTokens ||
      matchId // Disable button after match is created (waiting for players or auto-starting)
  );

  // Use centralized game mode configuration
  const gameModes = Object.values(GAME_TYPES).map((mode) => ({
    id: mode.id,
    name: mode.name,
    description: mode.description,
    players: mode.players,
    tokens: mode.tokensPerMatch,
  }));

  const serverAddress = 'play.blockwarriors.ai';

  const handleStartMatch = async () => {
    if (!selectedGameType) return;

    setIsLoading(true);

    try {
      const result = await startMatch(selectedGameType);

      if (result.error) {
        console.error('Failed to start match:', result.error);
        alert(`Error: ${result.error}`);
        return;
      }

      // Match created - tokens will be generated when Minecraft server acknowledges
      setMatchId(result.matchId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start match';
      console.error('Failed to start match:', errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <ServerIcon className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Practice Arena</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {gameModes.map((mode) => (
          <motion.div
            key={mode.id}
            className={`bg-black/40 backdrop-blur-md rounded-lg p-6 cursor-pointer border-2 transition-all ${
              selectedGameType === mode.id
                ? 'border-blue-500 bg-black/60'
                : 'border-transparent hover:border-white/20'
            }`}
            onClick={() => setSelectedGameType(mode.id as GameType)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              {mode.name}
            </h3>
            <p className="text-gray-400 text-sm mb-4">{mode.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{mode.players}</span>
              {selectedGameType === mode.id && (
                <span className="text-blue-400">Selected</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-black/40 backdrop-blur-md rounded-lg p-6 mb-6"
      >
        <div className="border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-xl font-bold text-yellow-500">
              Important Notice
            </h3>
          </div>
          <div className="space-y-5 text-sm text-gray-300 leading-relaxed px-2">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-bold text-yellow-500 text-base mb-3 underline decoration-yellow-500/30 underline-offset-4">
                Current Setup
              </h4>
              <p className="italic">
                The server is currently configured to accept{' '}
                <span className="font-semibold text-white">client players</span>{' '}
                with valid tokens. This setup is temporary and is only available
                for{' '}
                <span className="font-semibold text-white">
                  practice matches
                </span>
                .
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-bold text-yellow-500 text-base mb-3 underline decoration-yellow-500/30 underline-offset-4">
                Future Changes
              </h4>
              <p className="italic">
                In upcoming tournament phases, contestants will need to{' '}
                <span className="font-semibold text-white">
                  upload their Minflayer code
                </span>{' '}
                directly through this dashboard. The code will then be{' '}
                <span className="font-semibold text-white">
                  executed server-side
                </span>{' '}
                for enhanced security and fairness.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <UsersIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Active Sessions</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {serverStatus.activeSessions}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <UsersIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Players Online</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {serverStatus.playersOnline}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <ServerIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Server Load</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {serverStatus.serverLoad}%
            </p>
          </div>
        </div>

        <Button
          onClick={handleStartMatch}
          disabled={isButtonDisabled}
          className="w-full flex items-center justify-center gap-2 py-6 text-lg"
        >
          {isLoading || (matchId && hasTokens && allPlayersReady) ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
          {isLoading
            ? 'Starting Match...'
            : waitingForTokens
              ? 'Waiting for Server...'
              : matchId && hasTokens && allPlayersReady
                ? 'Server Starting Match...'
                : matchId && hasTokens && !allPlayersReady
                  ? `Waiting for Players (${matchData?.usedTokens || 0}/${matchData?.totalTokens || 0})`
                  : 'Start Match'}
        </Button>
      </motion.div>

      {/* Show waiting state when match is created but tokens not generated yet */}
      {waitingForTokens && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
            <h3 className="text-yellow-400 font-medium">
              Waiting for Minecraft server
            </h3>
          </div>
          <p className="text-sm text-gray-400">
            Waiting for Minecraft server to prepare the match...
          </p>
          {matchId && (
            <div className="text-xs text-gray-500 font-mono">
              Match ID: {matchId}
            </div>
          )}
        </motion.div>
      )}

      {/* Show tokens when they're available */}
      {hasTokens && matchData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CommandLineIcon className="w-5 h-5 text-primary" />
            <h3 className="text-primary font-medium">Connection Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Server Address</h4>
              <div className="font-mono bg-black/20 p-2 rounded text-primary select-all flex items-center justify-between group">
                <span>{serverAddress}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(serverAddress)}
                  className="text-xs text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Match Status */}
            {matchData && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Match Status</p>
                    <p className="text-lg font-semibold text-blue-400 capitalize">
                      {matchData.match_status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Players Joined</p>
                    <p className="text-lg font-semibold text-white">
                      {matchData.usedTokens} / {matchData.totalTokens}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tokens organized by teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Red Team Tokens */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-red-500/30">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <h4 className="text-base font-semibold text-red-400">
                    Red Team Tokens ({matchData.tokens.redTeam.length})
                  </h4>
                </div>
                {matchData.tokens.redTeam.map((tokenData, index) => {
                  const token =
                    typeof tokenData === 'string' ? tokenData : tokenData.token;
                  const ign =
                    typeof tokenData === 'string' ? null : tokenData.ign;
                  const isUsed =
                    typeof tokenData === 'string' ? false : tokenData.is_used;

                  return (
                    <div key={`red-${index}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs text-gray-400">
                          Token {index + 1}
                        </h4>
                        {isUsed && ign && (
                          <span className="text-xs text-primary font-medium">
                            ✓ {ign}
                          </span>
                        )}
                        {isUsed && !ign && (
                          <span className="text-xs text-primary font-medium">
                            ✓ Used
                          </span>
                        )}
                      </div>
                      <div
                        className={`font-mono bg-black/20 p-2 rounded select-all flex items-center justify-between group ${
                          isUsed
                            ? 'text-primary border border-primary/30'
                            : 'text-primary'
                        }`}
                      >
                        <span className="text-sm">{token}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(token)}
                          className="text-xs text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Blue Team Tokens */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-500/30">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h4 className="text-base font-semibold text-blue-400">
                    Blue Team Tokens ({matchData.tokens.blueTeam.length})
                  </h4>
                </div>
                {matchData.tokens.blueTeam.map((tokenData, index) => {
                  const token =
                    typeof tokenData === 'string' ? tokenData : tokenData.token;
                  const ign =
                    typeof tokenData === 'string' ? null : tokenData.ign;
                  const isUsed =
                    typeof tokenData === 'string' ? false : tokenData.is_used;

                  return (
                    <div key={`blue-${index}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs text-gray-400">
                          Token {index + 1}
                        </h4>
                        {isUsed && ign && (
                          <span className="text-xs text-primary font-medium">
                            ✓ {ign}
                          </span>
                        )}
                        {isUsed && !ign && (
                          <span className="text-xs text-primary font-medium">
                            ✓ Used
                          </span>
                        )}
                      </div>
                      <div
                        className={`font-mono bg-black/20 p-2 rounded select-all flex items-center justify-between group ${
                          isUsed
                            ? 'text-primary border border-primary/30'
                            : 'text-primary'
                        }`}
                      >
                        <span className="text-sm">{token}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(token)}
                          className="text-xs text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm text-gray-400">To join the game:</p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open Minecraft Java Edition</li>
              <li>Go to Multiplayer → Add Server</li>
              <li>Enter the server address</li>
              <li>
                Join the server and use{' '}
                <span className="text-primary">/login [token]</span> to start
                playing
              </li>
            </ol>
            <p className="text-sm text-gray-400 mt-4">
              Tokens will expire in 15 minutes
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
