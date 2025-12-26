/**
 * Match status definitions and constants.
 * 
 * This is the single source of truth for match status values.
 * The Beacon plugin (Java) should be manually kept in sync with these values.
 * See: packages/shared/constants/game-config.json
 */

import gameConfig from '../constants/game-config.json';

// Match status type - valid status values for a match
export type MatchStatus = 'Queuing' | 'Waiting' | 'Playing' | 'Finished' | 'Terminated';

// All valid match statuses (from config)
export const MATCH_STATUSES: readonly MatchStatus[] = gameConfig.matchStatuses as MatchStatus[];

// Match status as an object for easier lookup
export const MatchStatusEnum = {
  QUEUING: 'Queuing' as const,
  WAITING: 'Waiting' as const,
  PLAYING: 'Playing' as const,
  FINISHED: 'Finished' as const,
  TERMINATED: 'Terminated' as const,
};

// Terminal statuses (match is complete, no further transitions)
export const TERMINAL_STATUSES: readonly MatchStatus[] = ['Finished', 'Terminated'];

/**
 * Check if a status is a terminal status (no further transitions allowed)
 */
export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.includes(status as MatchStatus);
}

/**
 * Validate if a string is a valid match status
 */
export function isValidMatchStatus(status: string): status is MatchStatus {
  return MATCH_STATUSES.includes(status as MatchStatus);
}

/**
 * Validate if a status transition is valid
 * @param currentStatus - The current match status
 * @param newStatus - The target status to transition to
 * @returns true if the transition is valid
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Can't transition from terminal states
  if (isTerminalStatus(currentStatus)) {
    return false;
  }
  // Target must be a valid status
  return isValidMatchStatus(newStatus);
}
