// match.js
import express from 'express';
import { mutateWithAuth, queryWithAuth, api } from '../convexClient.js';
import { getIO, getSocketState } from '../socket.js';

const router = express.Router();

/**
 * Internal function to start a match when ready
 * This is called internally when match conditions are met (e.g., enough players joined)
 */
export async function startMatchInternal(matchId) {
  try {
    const state = getSocketState();
    const io = getIO();
    const gameSession = state.gameSessions.get(matchId);

    if (!gameSession) {
      console.warn(`No game session found for match ${matchId}`);
      return { success: false, error: 'No game session found' };
    }

    if (!gameSession.players || gameSession.players.size < 2) {
      console.warn(`Not enough players to start match ${matchId}. Current: ${gameSession.players?.size || 0}`);
      return { success: false, error: 'Not enough players' };
    }

    // Get match info from Convex
    const match = await queryWithAuth(
      api.matches.getMatchById,
      { matchId },
      null
    );

    if (!match) {
      console.warn(`Match ${matchId} not found in database`);
      return { success: false, error: 'Match not found' };
    }

    const playerUUIDArray = Array.from(gameSession.players);
    console.log("Starting match with Player UUIDs:", playerUUIDArray);

    // Determine players per team based on match type
    const playersPerTeam = Math.ceil(playerUUIDArray.length / 2);
    const blueTeam = playerUUIDArray.slice(0, playersPerTeam);
    const redTeam = playerUUIDArray.slice(playersPerTeam);

    // Emit to the server socket
    console.log("Emitting startMatch event to socket");
    io.emit("startMatch", {
      matchType: match.match_type || "pvp",
      playersPerTeam: playersPerTeam,
      blue_team: blueTeam,
      red_team: redTeam,
    });

    // Update match status to "started" in Convex
    try {
      await mutateWithAuth(
        api.matches.updateMatchStatus,
        {
          matchId: matchId,
          status: 'started',
        },
        null
      );
    } catch (error) {
      console.error('Failed to update match status:', error);
      // Don't fail if status update fails
    }

    console.log("Match started successfully:", {
      matchType: match.match_type || "pvp",
      playersPerTeam: playersPerTeam,
      blue_team: blueTeam,
      red_team: redTeam,
    });

    return { 
      success: true,
      matchType: match.match_type,
      blueTeam: blueTeam,
      redTeam: redTeam,
    };
  } catch (error) {
    console.error('Error starting match internally:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Start match endpoint - generates tokens and returns them
 * The actual match starting happens internally when players join via socket
 */
router.post("/start_match", async (req, res) => { 
  try {
    let authToken = req.headers.authorization;
    if (!authToken) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    // Strip "Bearer " prefix if present (Convex expects just the token) and validate
    const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;
    const user = await queryWithAuth(api.auth.validateAuthToken, {}, token);
    if (!user) return res.status(401).json({ error: 'Invalid authorization token' });

    const selectedMode = req.body.selectedMode;
    const tokensPerTeamMap = {
      'pvp': 1,
      'bedwars': 4,
      'ctf': 5,
    };
    if (!selectedMode) {
      return res.status(400).json({ error: 'Missing selected mode' });
    } else if (!(selectedMode in tokensPerTeamMap)) {
      return res.status(400).json({ error: `Invalid game mode: ${selectedMode}. Must be one of: ${Object.keys(tokensPerTeamMap).join(', ')}` });
    }

    // Generate tokens and create match using the Convex mutation
    const result = await mutateWithAuth(
      api.matches.createMatchWithTokens,
      {
        matchType: selectedMode,
        matchStatus: 'waiting',
        mode: selectedMode,
        userId: user._id,
        tokensPerTeam: tokensPerTeamMap[selectedMode],
      },
      token
    );

    console.log(`Match created with ID: ${result.matchId}`);
    console.log(`Red Team Tokens: ${result.tokens.redTeam.join(', ')}`);
    console.log(`Blue Team Tokens: ${result.tokens.blueTeam.join(', ')}`);

    // Sample response:
    // {
    //   "matchId": "j1234567890abcdef",
    //   "tokens": {
    //     "redTeam": ["uuid-1", "uuid-2"],
    //     "blueTeam": ["uuid-3", "uuid-4"]
    //   },
    //   "expiresAt": 1234567890000,
    //   "matchType": "bedwars"
    // }
    return res.status(200).json({
      matchId: result.matchId.toString(),
      tokens: result.tokens,
      expiresAt: result.expiresAt,
      matchType: selectedMode,
    });
  } catch (error) {
    console.error('Error in start_match:', error);
    return res.status(500).json({ 
      error: 'Failed to start match',
      details: error.message 
    });
  }
});

export default router;