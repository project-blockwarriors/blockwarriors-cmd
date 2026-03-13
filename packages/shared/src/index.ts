/**
 * @packages/shared
 * 
 * Shared constants and types for BlockWarriors.
 * This package serves as the single source of truth for:
 * - Game type configurations (pvp, bedwars, ctf)
 * - Match status values
 * - HTTP response formats
 * 
 * IMPORTANT: The Beacon plugin (Java) cannot directly import this package.
 * When updating constants here, also update:
 * - apps/blockwarriors-beacon/src/main/java/ai/blockwarriors/beacon/constants/GameConfig.java
 * - packages/shared/constants/game-config.json (source of truth for cross-language sync)
 */

// Game types
export {
  type GameType,
  type MatchMode,
  type GameTypeConfig,
  type MatchModeConfig,
  GAME_CONFIG,
  GAME_TYPES,
  MATCH_MODES,
  getGameTypeConfig,
  getTokensPerTeam,
  isValidGameType,
  isValidMatchMode,
  getValidGameTypes,
  getValidMatchModes,
} from './game-types';

// Match status
export {
  type MatchStatus,
  MATCH_STATUSES,
  MatchStatusEnum,
  TERMINAL_STATUSES,
  isTerminalStatus,
  isValidMatchStatus,
  isValidStatusTransition,
} from './match-status';

// HTTP responses
export {
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
  isSuccessResponse,
  isErrorResponse,
  createSuccessResponse,
  createErrorResponse,
} from './http-responses';
