/**
 * Game type definitions and constants.
 * 
 * This is the single source of truth for game type configurations.
 * The Beacon plugin (Java) should be manually kept in sync with these values.
 * See: packages/shared/constants/game-config.json
 */

import gameConfig from '../constants/game-config.json';

// Game types (pvp, bedwars, ctf) - determines the game being played
export type GameType = 'pvp' | 'bedwars' | 'ctf';

// Match modes - determines competitive context (practice vs ranked)
export type MatchMode = 'practice' | 'ranked';

// Game type configuration
export interface GameTypeConfig {
  id: GameType;
  name: string;
  description: string;
  tokensPerTeam: number;
  players: string;
}

// Match mode configuration
export interface MatchModeConfig {
  id: MatchMode;
  name: string;
  description: string;
}

// Export the raw config for direct access
export const GAME_CONFIG = gameConfig;

// Game types mapped by ID
export const GAME_TYPES: Record<GameType, GameTypeConfig> = gameConfig.gameTypes as Record<GameType, GameTypeConfig>;

// Match modes mapped by ID
export const MATCH_MODES: Record<MatchMode, MatchModeConfig> = gameConfig.matchModes as Record<MatchMode, MatchModeConfig>;

/**
 * Get game type configuration by ID
 * @throws Error if game type is invalid
 */
export function getGameTypeConfig(gameType: GameType): GameTypeConfig {
  const config = GAME_TYPES[gameType];
  if (!config) {
    throw new Error(`Invalid game type: ${gameType}`);
  }
  return config;
}

/**
 * Get the number of tokens required per team for a game type
 * @returns Number of tokens per team (defaults to 1 if unknown type)
 */
export function getTokensPerTeam(gameType: string): number {
  const config = GAME_TYPES[gameType as GameType];
  return config?.tokensPerTeam ?? 1;
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

/**
 * Get all valid game type IDs
 */
export function getValidGameTypes(): GameType[] {
  return Object.keys(GAME_TYPES) as GameType[];
}

/**
 * Get all valid match mode IDs
 */
export function getValidMatchModes(): MatchMode[] {
  return Object.keys(MATCH_MODES) as MatchMode[];
}
