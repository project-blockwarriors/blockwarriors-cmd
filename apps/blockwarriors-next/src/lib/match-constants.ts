/**
 * Match configuration constants and type definitions
 * 
 * This file re-exports shared constants from @packages/shared.
 * The source of truth for game types and their configurations is:
 * packages/shared/constants/game-config.json
 */

// Re-export everything from shared package
export {
  type GameType,
  type MatchMode,
  type MatchStatus,
  type GameTypeConfig,
  type MatchModeConfig,
  GAME_TYPES,
  MATCH_MODES,
  MATCH_STATUSES,
  MatchStatusEnum,
  getGameTypeConfig,
  getTokensPerTeam,
  isValidGameType,
  isValidMatchMode,
  isValidMatchStatus,
  isTerminalStatus,
} from '@packages/shared';
