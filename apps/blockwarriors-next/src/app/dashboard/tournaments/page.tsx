'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';
import {
  TrophyIcon,
  PlusIcon,
  UserGroupIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  TOURNAMENT_STATUSES,
  TOURNAMENT_FORMATS,
  type TournamentStatus,
  type TournamentFormat,
} from '@/lib/tournament-constants';
import { authClient } from '@/lib/auth-client';

type FilterType = 'all' | 'official' | 'my';

export default function TournamentsPage() {
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>(
    'all'
  );
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Fetch tournaments based on filter
  const tournaments = useQuery(
    api.tournaments.listTournaments,
    typeFilter === 'my'
      ? 'skip'
      : {
          status: statusFilter === 'all' ? undefined : statusFilter,
          isOfficial: typeFilter === 'official' ? true : undefined,
        }
  );
  const myTournaments = useQuery(
    api.tournaments.getMyTournaments,
    typeFilter === 'my' && userId ? { userId } : 'skip'
  );
  const baseTournaments =
    typeFilter === 'my' ? myTournaments ?? [] : tournaments ?? [];
  const filteredTournaments =
    statusFilter === 'all'
      ? baseTournaments
      : baseTournaments.filter((tournament) => {
          return tournament.status === statusFilter;
        });
  const isLoading =
    typeFilter === 'my'
      ? Boolean(userId && myTournaments === undefined)
      : tournaments === undefined;

  // Get status badge color
  const getStatusBadge = (status: TournamentStatus) => {
    const statusInfo = TOURNAMENT_STATUSES[status];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} bg-white/5`}
      >
        {statusInfo.name}
      </span>
    );
  };

  // Get format badge
  const getFormatBadge = (format: TournamentFormat) => {
    const formatInfo = TOURNAMENT_FORMATS[format];
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-400 bg-white/5">
        {formatInfo.name}
      </span>
    );
  };

  const getBoLabel = (gamesPerMatch: number) =>
    gamesPerMatch === 1 ? 'Bo1' : `Bo${gamesPerMatch * 2 - 1}`;


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TrophyIcon className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Tournaments</h1>
            <p className="text-gray-400 text-sm">
              Compete in official qualifiers and community tournaments
            </p>
          </div>
        </div>
        <Link href="/dashboard/tournaments/create">
          <Button className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Create Tournament
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 mb-6 border border-white/10">
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Type:</span>
            <div className="flex gap-1">
              {(['all', 'official', 'my'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    typeFilter === type
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {type === 'all'
                    ? 'All'
                    : type === 'official'
                      ? 'Official'
                      : 'My Tournaments'}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Status:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {(
                Object.keys(TOURNAMENT_STATUSES) as TournamentStatus[]
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {TOURNAMENT_STATUSES[status].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-12 border border-white/10 text-center">
          <TrophyIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No tournaments found
          </h3>
          <p className="text-gray-400 mb-6">
            {typeFilter === 'my' && !userId
              ? 'Sign in to view your tournaments'
              : statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to create a tournament!'}
          </p>
          <Link href="/dashboard/tournaments/create">
            <Button>Create Tournament</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Link
              key={tournament._id}
              href={`/dashboard/tournaments/${tournament._id}`}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10 hover:border-primary/50 transition-all cursor-pointer h-full"
              >
                {/* Official Badge */}
                {tournament.is_official && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-medium mb-3">
                    <SparklesIcon className="w-4 h-4" />
                    Official Tournament
                  </div>
                )}

                {/* Title and Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white line-clamp-1">
                    {tournament.name}
                  </h3>
                </div>

                {/* Status and Format */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {getStatusBadge(tournament.status)}
                  {getFormatBadge(tournament.format)}
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-400 bg-white/5">
                    {getBoLabel(tournament.games_per_match)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {tournament.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-gray-400">
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="text-sm">
                      {tournament.participant_count} / {tournament.max_teams}{' '}
                      teams
                    </span>
                  </div>
                  {tournament.start_time && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(tournament.start_time).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Registration Progress */}
                {tournament.status === 'registration' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Registration</span>
                      <span>
                        {Math.round(
                          (tournament.participant_count / tournament.max_teams) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(tournament.participant_count / tournament.max_teams) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
