'use server';

import { getToken } from '@/lib/auth-server';
import { getUser } from '@/auth/server';
import { isValidGameMode, type GameMode } from '@/lib/match-constants';

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') ||
  '';

export interface StartMatchResult {
  matchId: string;
  tokens: {
    redTeam: string[];
    blueTeam: string[];
  };
  expiresAt: number;
  matchType: string;
  error?: string;
}

/**
 * Start a match by generating tokens
 * Calls Convex HTTP route /matches/start
 */
export async function startMatch(
  selectedMode: string
): Promise<StartMatchResult> {
  try {
    // Validate user is authenticated
    const user = await getUser();
    if (!user) {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error: 'Not authenticated. Please log in to start a match.',
      };
    }

    // Validate game mode
    if (!selectedMode || typeof selectedMode !== 'string') {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error:
          'Invalid game mode. selectedMode is required and must be a string.',
      };
    }

    if (!isValidGameMode(selectedMode)) {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error: `Invalid game mode. Game mode must be one of: pvp, bedwars, ctf`,
      };
    }

    if (!CONVEX_SITE_URL) {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error:
          'Convex site URL not configured. Please set CONVEX_SITE_URL environment variable.',
      };
    }

    // Get Convex auth token for authentication
    const token = await getToken();
    if (!token) {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error:
          'Authentication failed. Failed to get Convex authentication token.',
      };
    }

    // Call Convex HTTP route /matches/start
    const response = await fetch(`${CONVEX_SITE_URL}/matches/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ selectedMode }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
      console.error('Convex HTTP route error:', {
        status: response.status,
        errorData,
      });

      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error:
          errorData.error ||
          errorData.details ||
          errorData.message ||
          `Failed to start match (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      matchId: data.matchId,
      tokens: data.tokens,
      expiresAt: data.expiresAt,
      matchType: data.matchType || selectedMode,
    };
  } catch (error) {
    console.error('Error starting match:', error);
    const errorMessage =
      error instanceof Error
        ? `${error.message}${error.cause ? ` (cause: ${error.cause})` : ''}`
        : 'Unknown error occurred';

    return {
      matchId: '',
      tokens: { redTeam: [], blueTeam: [] },
      expiresAt: 0,
      matchType: '',
      error: `Failed to start match: ${errorMessage}`,
    };
  }
}
