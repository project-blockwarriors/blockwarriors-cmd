'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { api } from '@/lib/convex';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrophyIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
  TOURNAMENT_FORMATS,
  GAME_TYPES,
  GAMES_PER_MATCH_OPTIONS,
  DEFAULT_TOURNAMENT_CONFIG,
  type TournamentFormat,
  type GameType,
} from '@/lib/tournament-constants';
import { authClient } from '@/lib/auth-client';

export default function CreateTournamentPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const createTournament = useMutation(api.tournaments.createTournament);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('round_robin');
  const [gameType, setGameType] = useState<GameType>(DEFAULT_TOURNAMENT_CONFIG.gameType);
  const [minTeams, setMinTeams] = useState(DEFAULT_TOURNAMENT_CONFIG.minTeams);
  const [maxTeams, setMaxTeams] = useState(DEFAULT_TOURNAMENT_CONFIG.maxTeams);
  const [gamesPerMatch, setGamesPerMatch] = useState(
    DEFAULT_TOURNAMENT_CONFIG.gamesPerMatch
  );
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [startTime, setStartTime] = useState('');

  // Note: isOfficial is always false for non-admin users
  // Admin functionality will be added later
  const isOfficial = false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session?.user?.id) {
      setError('You must be logged in to create a tournament');
      return;
    }

    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }

    if (!description.trim()) {
      setError('Tournament description is required');
      return;
    }

    if (minTeams < 2) {
      setError('Minimum teams must be at least 2');
      return;
    }

    if (maxTeams < minTeams) {
      setError('Maximum teams must be at least equal to minimum teams');
      return;
    }

    setIsSubmitting(true);

    try {
      const tournamentId = await createTournament({
        name: name.trim(),
        description: description.trim(),
        format,
        gameType,
        isOfficial,
        createdBy: session.user.id,
        minTeams,
        maxTeams,
        gamesPerMatch,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).getTime()
          : undefined,
        startTime: startTime ? new Date(startTime).getTime() : undefined,
      });

      router.push(`/dashboard/tournaments/${tournamentId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create tournament';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/tournaments">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <TrophyIcon className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Create Tournament</h1>
            <p className="text-gray-400 text-sm">
              Set up a new tournament for teams to compete
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 border border-white/10 space-y-6">
          {/* Basic Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tournament Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Winter Championship 2026"
                  className="mt-1"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your tournament, rules, and prizes..."
                  className="mt-1 min-h-[100px]"
                  maxLength={1000}
                />
              </div>

              <div>
                <Label htmlFor="format">Tournament Format</Label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as TournamentFormat)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TOURNAMENT_FORMATS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{info.name}</span>
                          <span className="text-xs text-gray-400">
                            {info.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gameType">Game Type</Label>
                <Select
                  value={gameType}
                  onValueChange={(value) => setGameType(value as GameType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GAME_TYPES).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{info.name} ({info.players})</span>
                          <span className="text-xs text-gray-400">
                            {info.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Team Settings */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Team Settings
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minTeams">Minimum Teams</Label>
                <Input
                  id="minTeams"
                  type="number"
                  min={2}
                  max={64}
                  value={minTeams}
                  onChange={(e) => setMinTeams(parseInt(e.target.value) || 2)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Tournament won&apos;t start with fewer teams
                </p>
              </div>

              <div>
                <Label htmlFor="maxTeams">Maximum Teams</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min={minTeams}
                  max={128}
                  value={maxTeams}
                  onChange={(e) =>
                    setMaxTeams(parseInt(e.target.value) || minTeams)
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Registration closes when reached
                </p>
              </div>
            </div>
          </div>

          {/* Match Settings */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Match Settings
            </h2>

            <div>
              <Label htmlFor="gamesPerMatch">Games Per Match</Label>
              <Select
                value={gamesPerMatch.toString()}
                onValueChange={(value) => setGamesPerMatch(parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAMES_PER_MATCH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-gray-400">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Schedule</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationDeadline">
                  Registration Deadline
                </Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Optional</p>
              </div>

              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Optional</p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-blue-400 mb-1">
                  About Tournament Creation
                </p>
                <p>
                  After creating the tournament, teams can join during the
                  registration period. You can manually start the tournament once
                  the minimum number of teams have registered, or it will start
                  automatically at the scheduled time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/tournaments">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </div>
            ) : (
              'Create Tournament'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
