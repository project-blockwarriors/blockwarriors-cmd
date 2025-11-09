/**
 * Match configuration constants and type definitions
 */

export type GameMode = 'pvp' | 'bedwars' | 'ctf';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  players: string;
  tokensPerMatch: number;
  tokensPerTeam: number;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
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

/**
 * Get game mode configuration
 */
export function getGameModeConfig(mode: GameMode): GameModeConfig {
  const config = GAME_MODES[mode];
  if (!config) {
    throw new Error(`Invalid game mode: ${mode}`);
  }
  return config;
}

/**
 * Validate if a string is a valid game mode
 */
export function isValidGameMode(mode: string): mode is GameMode {
  return mode in GAME_MODES;
}


