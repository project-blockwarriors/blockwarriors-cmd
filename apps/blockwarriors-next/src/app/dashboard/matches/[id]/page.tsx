'use client';

import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/convex';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import {
  ServerIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;

  const matchData = useQuery(
    api.matches.getMatchById,
    matchId ? { matchId: matchId as Id<"matches"> } : "skip"
  );

  if (matchData === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (matchData === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Match Not Found</h1>
          <p className="text-gray-400">The match you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const matchState = matchData.match_state as any;
  const players = Array.isArray(matchState?.players) ? matchState.players : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <ServerIcon className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Match Details</h1>
          <p className="text-gray-400 text-sm">Match ID: {matchId}</p>
        </div>
      </div>

      {/* Match Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <ServerIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Match Type</span>
          </div>
          <p className="text-2xl font-semibold text-white capitalize">
            {matchData.match_type}
          </p>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <UsersIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Status</span>
          </div>
          <p className="text-2xl font-semibold text-blue-400 capitalize">
            {matchData.match_status}
          </p>
        </div>

        <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <ClockIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Mode</span>
          </div>
          <p className="text-2xl font-semibold text-white capitalize">
            {matchData.mode}
          </p>
        </div>
      </div>

      {/* Match State Display */}
      {matchState && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">Match State</h2>
          
          {players.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Players ({players.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((playerData: any, index: number) => (
                  <div
                    key={playerData.playerId || index}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">
                        {playerData.ign || playerData.playerId?.substring(0, 8) || `Player ${index + 1}`}
                      </h4>
                      {playerData.health !== undefined && (
                        <span className={`text-sm font-medium ${
                          playerData.health > 10 ? 'text-green-400' : 
                          playerData.health > 5 ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          ❤ {playerData.health?.toFixed(1) || 'N/A'}
                          {playerData.maxHealth && ` / ${playerData.maxHealth.toFixed(1)}`}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mt-3">
                      {playerData.position && (
                        <div>
                          <span className="text-gray-500">Position: </span>
                          <span className="text-white">
                            {Math.round(playerData.position.x)}, {Math.round(playerData.position.y)}, {Math.round(playerData.position.z)}
                          </span>
                        </div>
                      )}
                      {playerData.kills !== undefined && (
                        <div>
                          <span className="text-gray-500">Kills: </span>
                          <span className="text-green-400">{playerData.kills}</span>
                        </div>
                      )}
                      {playerData.deaths !== undefined && (
                        <div>
                          <span className="text-gray-500">Deaths: </span>
                          <span className="text-red-400">{playerData.deaths}</span>
                        </div>
                      )}
                      {playerData.foodLevel !== undefined && (
                        <div>
                          <span className="text-gray-500">Food: </span>
                          <span className="text-yellow-400">{playerData.foodLevel}</span>
                        </div>
                      )}
                      {playerData.nearbyPlayers !== undefined && (
                        <div>
                          <span className="text-gray-500">Nearby: </span>
                          <span className="text-purple-400">{playerData.nearbyPlayers}</span>
                        </div>
                      )}
                    </div>

                    {playerData.equipment && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-500 mb-1">Equipment:</p>
                        <div className="flex flex-wrap gap-2">
                          {playerData.equipment.mainHand && playerData.equipment.mainHand !== 'None' && (
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                              Hand: {playerData.equipment.mainHand}
                            </span>
                          )}
                          {playerData.equipment.helmet && playerData.equipment.helmet !== 'None' && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                              Head: {playerData.equipment.helmet}
                            </span>
                          )}
                          {playerData.equipment.chestplate && playerData.equipment.chestplate !== 'None' && (
                            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                              Chest: {playerData.equipment.chestplate}
                            </span>
                          )}
                          {playerData.equipment.leggings && playerData.equipment.leggings !== 'None' && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                              Legs: {playerData.equipment.leggings}
                            </span>
                          )}
                          {playerData.equipment.boots && playerData.equipment.boots !== 'None' && (
                            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                              Feet: {playerData.equipment.boots}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No player data available yet.</p>
              <p className="text-gray-500 text-sm mt-2">
                Match state will update as players join and play.
              </p>
            </div>
          )}

          {/* Raw JSON View (for debugging) */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              View Raw Match State (JSON)
            </summary>
            <pre className="mt-2 p-4 bg-black/40 rounded text-xs text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(matchState, null, 2)}
            </pre>
          </details>
        </motion.div>
      )}

      {!matchState && (
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10 text-center">
          <p className="text-gray-400">Match state data will appear here once the match starts.</p>
        </div>
      )}
    </motion.div>
  );
}

