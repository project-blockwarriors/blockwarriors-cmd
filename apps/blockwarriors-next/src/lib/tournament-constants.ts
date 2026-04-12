/**
 * Tournament system constants and types.
 * Single source of truth for tournament-related enums and configuration.
 */

// Tournament format types
export type TournamentFormat = "round_robin" | "double_elim";

export const TOURNAMENT_FORMATS: Record<
  TournamentFormat,
  { id: TournamentFormat; name: string; description: string }
> = {
  round_robin: {
    id: "round_robin",
    name: "Round Robin",
    description:
      "Every team plays against every other team. Best for qualifiers.",
  },
  double_elim: {
    id: "double_elim",
    name: "Double Elimination",
    description:
      "Teams must lose twice to be eliminated. Winners and losers brackets.",
  },
};

// Tournament status types
export type TournamentStatus =
  | "registration"
  | "in_progress"
  | "completed"
  | "cancelled";

export const TOURNAMENT_STATUSES: Record<
  TournamentStatus,
  { id: TournamentStatus; name: string; description: string; color: string }
> = {
  registration: {
    id: "registration",
    name: "Registration Open",
    description: "Teams can join the tournament",
    color: "text-blue-400",
  },
  in_progress: {
    id: "in_progress",
    name: "In Progress",
    description: "Tournament matches are being played",
    color: "text-green-400",
  },
  completed: {
    id: "completed",
    name: "Completed",
    description: "Tournament has finished",
    color: "text-purple-400",
  },
  cancelled: {
    id: "cancelled",
    name: "Cancelled",
    description: "Tournament was cancelled",
    color: "text-gray-400",
  },
};

// Tournament match status types
export type TournamentMatchStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export const TOURNAMENT_MATCH_STATUSES: Record<
  TournamentMatchStatus,
  { id: TournamentMatchStatus; name: string; color: string }
> = {
  pending: {
    id: "pending",
    name: "Pending",
    color: "text-gray-400",
  },
  scheduled: {
    id: "scheduled",
    name: "Scheduled",
    color: "text-blue-400",
  },
  in_progress: {
    id: "in_progress",
    name: "In Progress",
    color: "text-yellow-400",
  },
  completed: {
    id: "completed",
    name: "Completed",
    color: "text-green-400",
  },
  cancelled: {
    id: "cancelled",
    name: "Cancelled",
    color: "text-red-400",
  },
};

// Game types available for tournaments
export type GameType = "pvp" | "bridge" | "ctf";

export const GAME_TYPES: Record<
  GameType,
  { id: GameType; name: string; description: string; players: string }
> = {
  pvp: {
    id: "pvp",
    name: "PvP",
    description: "1v1 deathmatch — last bot standing wins",
    players: "1v1",
  },
  bridge: {
    id: "bridge",
    name: "Bridge",
    description: "1v1 — bridge across the void and enter the enemy goal",
    players: "1v1",
  },
  ctf: {
    id: "ctf",
    name: "Capture the Flag",
    description: "4v4 — capture the enemy flag and return it to your base",
    players: "4v4",
  },
};

// Default tournament configuration
export const DEFAULT_TOURNAMENT_CONFIG = {
  minTeams: 4,
  maxTeams: 16,
  gamesPerMatch: 1, // Single game per match by default
  gameType: "pvp" as GameType,
};

// Games per match options for best-of-N
export const GAMES_PER_MATCH_OPTIONS = [
  { value: 1, label: "Single Game", description: "One game decides the match" },
  {
    value: 2,
    label: "Best of 3",
    description: "First to win 2 games wins the match",
  },
  {
    value: 3,
    label: "Best of 5",
    description: "First to win 3 games wins the match",
  },
];

/**
 * Calculate games required to win for best-of-N format
 * @param gamesPerMatch - The games_per_match value from tournament config
 * @returns Number of games needed to win the match
 */
export function getGamesRequiredToWin(gamesPerMatch: number): number {
  // gamesPerMatch represents how many games a team needs to win
  // For best-of-3, gamesPerMatch = 2 (need to win 2 games)
  // For best-of-5, gamesPerMatch = 3 (need to win 3 games)
  return gamesPerMatch;
}

/**
 * Calculate total possible games in a best-of-N match
 * @param gamesPerMatch - The games_per_match value from tournament config
 * @returns Maximum number of games that could be played
 */
export function getMaxGamesInMatch(gamesPerMatch: number): number {
  // For best-of-N, max games = 2*gamesPerMatch - 1
  // Single game: 1, Best-of-3: 3, Best-of-5: 5
  return gamesPerMatch === 1 ? 1 : 2 * gamesPerMatch - 1;
}
