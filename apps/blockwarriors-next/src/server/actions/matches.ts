'use server';

import { getToken } from '@/lib/auth-server';
import { getUser } from '@/auth/server';
import { isValidGameType } from '@/lib/match-constants';

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL || process.env.NEXT_PUBLIC_CONVEX_SITE_URL || '';

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

export interface UpdateMatchStatusResult {
  success: boolean;
  error?: string;
}

/**
 * Start a match by creating it (without tokens)
 * Tokens will be generated when Minecraft server acknowledges the match
 * Calls Convex HTTP route /matches/new
 */
export async function startMatch(
  gameType: string
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

    // Validate game type
    if (!gameType || typeof gameType !== 'string') {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error:
          'Invalid game type. gameType is required and must be a string.',
      };
    }

    if (!isValidGameType(gameType)) {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error: `Invalid game type. Game type must be one of: pvp, bedwars, ctf`,
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

    // Call Convex HTTP route /matches/new (creates match without tokens)
    // match_type = game type (pvp, bedwars, ctf)
    // mode = match mode (practice, ranked) - this is for practice matches
    const response = await fetch(`${CONVEX_SITE_URL}/matches/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        match_type: gameType,
        mode: 'practice',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      console.error('Convex HTTP route error:', {
        status: response.status,
        errorData,
      });

      // Handle new standardized error format: { success: false, error: string }
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error:
          errorData.error ||
          `Failed to start match (${response.status})`,
      };
    }

    const responseData = await response.json();
    
    // Handle new standardized response format: { success: true, data: {...} }
    if (!responseData.success) {
      return {
        matchId: '',
        tokens: { redTeam: [], blueTeam: [] },
        expiresAt: 0,
        matchType: '',
        error: responseData.error || 'Failed to start match',
      };
    }
    
    const data = responseData.data;
    // Match is created but tokens haven't been generated yet
    // Tokens will be generated when Minecraft server acknowledges the match
    return {
      matchId: data.match_id || data.matchId,
      tokens: { redTeam: [], blueTeam: [] }, // Empty - tokens generated on acknowledge
      expiresAt: data.expires_at || data.expiresAt || 0,
      matchType: data.match_type || data.matchType || gameType,
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
