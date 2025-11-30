/**
 * Match configuration constants and type definitions
 */

// Game types (pvp, bedwars, ctf) - determines the game being played
export type GameType = 'pvp' | 'bedwars' | 'ctf';

// Match modes - determines competitive context (practice vs ranked)
export type MatchMode = 'practice' | 'ranked';

export interface GameTypeConfig {
  id: GameType;
  name: string;
  description: string;
  players: string;
  tokensPerMatch: number;
  tokensPerTeam: number;
}

export const GAME_TYPES: Record<GameType, GameTypeConfig> = {
  pvp: {
    id: 'pvp',
    name: 'Normal PvP',
    description: 'Classic player versus player combat',
    players: '1v1',
    tokensPerMatch: 2,
    tokensPerTeam: 1,
  },
  bedwars: {
    id: 'bedwars',
    name: 'Bed Wars',
    description: 'Protect your bed and destroy others',
    players: '4v4',
    tokensPerMatch: 8,
    tokensPerTeam: 4,
  },
  ctf: {
    id: 'ctf',
    name: 'Capture the Flag',
    description: 'Strategic team-based gameplay',
    players: '5v5',
    tokensPerMatch: 10,
    tokensPerTeam: 5,
  },
};

export const MATCH_MODES: Record<MatchMode, { id: MatchMode; name: string; description: string }> = {
  practice: {
    id: 'practice',
    name: 'Practice',
    description: 'Casual matches for testing and learning',
  },
  ranked: {
    id: 'ranked',
    name: 'Ranked',
    description: 'Competitive matches that affect team ELO',
  },
};

/**
 * Get game type configuration
 */
export function getGameTypeConfig(gameType: GameType): GameTypeConfig {
  const config = GAME_TYPES[gameType];
  if (!config) {
    throw new Error(`Invalid game type: ${gameType}`);
  }
  return config;
}

/**
 * Validate if a string is a valid game type
 */
export function isValidGameType(gameType: string): gameType is GameType {
  return gameType in GAME_TYPES;
}

/**
 * Validate if a string is a valid match mode
 */
export function isValidMatchMode(mode: string): mode is MatchMode {
  return mode in MATCH_MODES;
}
