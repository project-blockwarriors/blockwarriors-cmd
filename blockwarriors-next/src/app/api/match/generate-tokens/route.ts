import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getToken } from '@/lib/auth-server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/lib/convex';
import { getUser } from '@/auth/server';
import { isValidGameMode, getGameModeConfig, type GameMode } from '@/lib/match-constants';

// Mark route as dynamic to ensure cookies are available
export const dynamic = 'force-dynamic';

/**
 * POST /api/match/generate-tokens
 * 
 * Generates tokens for a practice match.
 * Authenticates the user, validates the game mode, and creates
 * a match with tokens atomically via Convex.
 */
export async function POST(request: Request) {
  try {
    // Ensure cookies are available
    await cookies();

    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated', message: 'Please log in to generate tokens' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const { selectedMode } = body;

    // Validate game mode
    if (!selectedMode || typeof selectedMode !== 'string') {
      return NextResponse.json(
        { error: 'Invalid game mode', message: 'selectedMode is required and must be a string' },
        { status: 400 }
      );
    }

    if (!isValidGameMode(selectedMode)) {
      return NextResponse.json(
        { error: 'Invalid game mode', message: `Game mode must be one of: pvp, bedwars, ctf` },
        { status: 400 }
      );
    }

    // Get game mode configuration
    const gameModeConfig = getGameModeConfig(selectedMode as GameMode);

    // Get Convex auth token for mutation
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication failed', message: 'Failed to get Convex authentication token' },
        { status: 401 }
      );
    }

    // Create match with tokens atomically
    const result = await fetchMutation(
      api.matches.createMatchWithTokens,
      {
        matchType: selectedMode,
        matchStatus: 'waiting',
        mode: selectedMode,
        userId: user.id,
        tokensPerTeam: gameModeConfig.tokensPerTeam,
      },
      { token }
    );

    // Return structured response
    return NextResponse.json({
      matchId: result.matchId.toString(),
      tokens: result.tokens,
      expiresAt: result.expiresAt,
      matchType: selectedMode,
      tokensPerTeam: gameModeConfig.tokensPerTeam,
      totalTokens: result.tokens.length,
    });
  } catch (error) {
    console.error('Error generating tokens:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate tokens',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}


