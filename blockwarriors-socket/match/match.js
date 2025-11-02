// match.js
import express from 'express';
import { mutateWithAuth, queryWithAuth, api } from '../convexClient.js';
import { getIO, getSocketState } from '../socket.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();


/**
 * @deprecated This endpoint is deprecated. Use POST /api/match/generate-tokens in Next.js instead.
 * This endpoint will be removed in a future version.
 * 
 * Add from Next.js OLD api route: generate_tokens
 */
router.post("/generate_tokens", async (req, res) => {
  console.warn("DEPRECATED: /api/match/generate_tokens endpoint called. Please use Next.js API route instead.");
  console.log("REQUEST RECEIVED");
  const selectedMode = req.body.selectedMode;
  const authToken = req.headers.authorization;

  if (!selectedMode) {
    return res.status(400).json({ error: 'Missing selected mode' });
  }

  if (!authToken) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  // Validate auth token and get user
  const user = await queryWithAuth(api.auth.validateAuthToken, {}, authToken);
  if (!user) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  // JWT token, (refresh token), -> 
  // const userId = (await getUser()).id;
  // Rewrite code below as SQL queries.

  // Insert into matches table
  // const { data: matchData, error: matchError } = await supabase
  //   .from('matches')
  //   .insert([{ mode: selectedMode }])
  //   .select('match_id')
  //   .single();
  
  // Create

  try {
    // Create game teams (red and blue)
    const gameTeams = await mutateWithAuth(
      api.gameTeams.createGameTeamsForMatch,
      {
        redTeamBots: [1],
        blueTeamBots: [2],
      },
      authToken
    );

    const redTeamId = gameTeams.redTeamId;
    const blueTeamId = gameTeams.blueTeamId;

    // Create match
    const matchId = await mutateWithAuth(
      api.matches.createMatch,
      {
        matchType: selectedMode,
        matchStatus: 'waiting',
        blueTeamId: blueTeamId,
        redTeamId: redTeamId,
        mode: selectedMode,
      },
      authToken
    );



    // Generate tokens for the match
    let tokens = [];
    const selectedModeToTokenMap = {
      'pvp': 2,
      'bedwars': 8,
      'ctf': 10,
    };

    const tokensPerTeam = selectedModeToTokenMap[selectedMode] / 2;

    // Generate tokens for red team
    for (let i = 0; i < tokensPerTeam; i++) {
      let token;
      let tokenCreated = false;
      do {
        token = uuidv4();
        try {
          await mutateWithAuth(
            api.tokens.createToken,
            {
              token: token,
              userId: user.id,
              matchId: matchId,
              gameTeamId: redTeamId,
              botId: null,
            },
            authToken
          );
          tokens.push(token);
          tokenCreated = true;
        } catch (error) {
          // Token already exists, try again
          if (error.message && error.message.includes('already exists')) {
            tokenCreated = false;
          } else {
            throw error;
          }
        }
      } while (!tokenCreated);
    }

    // Generate tokens for blue team
    for (let i = 0; i < tokensPerTeam; i++) {
      let token;
      let tokenCreated = false;
      do {
        token = uuidv4();
        try {
          await mutateWithAuth(
            api.tokens.createToken,
            {
              token: token,
              userId: user.id,
              matchId: matchId,
              gameTeamId: blueTeamId,
              botId: null,
            },
            authToken
          );
          tokens.push(token);
          tokenCreated = true;
        } catch (error) {
          // Token already exists, try again
          if (error.message && error.message.includes('already exists')) {
            tokenCreated = false;
          } else {
            throw error;
          }
        }
      } while (!tokenCreated);
    }

    console.log(`Match created with ID: ${matchId}`);
    console.log(`Tokens created: ${tokens.join(', ')}`);
    console.log(`Red Team ID: ${redTeamId}`);
    console.log(`Blue Team ID: ${blueTeamId}`);
    // Convert Convex ID to string for JSON response
    return res.status(200).json({ tokens, matchId: matchId.toString() });
  } catch (error) {
    console.error('Error generating tokens:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate tokens' });
  }
});



// Add from Next.js OLD api route: start_match
router.post("/start_match", async (req, res) => { 
  try {
    const tokens = req.body.tokens;
    const matchId = req.body.matchId;

    // Validate input
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing tokens array' });
    }

    if (!matchId) {
      return res.status(400).json({ error: 'Missing matchId' });
    }

    console.log("REQUEST RECEIVED");
    console.log("Tokens: ", tokens);
    console.log("Match ID: ", matchId);

    // Convert matchId string to Convex ID type
    // matchId comes as a string from the request, but Convex expects Id<"matches">
    let matchIdAsId;
    try {
      // Convex IDs are strings, so we can use them directly
      matchIdAsId = matchId;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid matchId format' });
    }

    // Validate match exists in Convex and get match info
    let match;
    try {
      match = await queryWithAuth(
        api.matches.getMatchById,
        { matchId: matchIdAsId },
        null // No auth needed for match lookup
      );

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      return res.status(500).json({ 
        error: 'Failed to validate match',
        details: error.message 
      });
    }

    // Validate tokens belong to this match
    try {
      for (const tokenWithPrefix of tokens) {
        // Strip "GAME_" prefix if present
        const token = tokenWithPrefix.startsWith('GAME_') 
          ? tokenWithPrefix.substring(5) 
          : tokenWithPrefix;

        const tokenValidation = await queryWithAuth(
          api.tokens.validateToken,
          { token },
          null
        );

        if (!tokenValidation || !tokenValidation.valid) {
          return res.status(400).json({ 
            error: `Invalid token: ${tokenWithPrefix}` 
          });
        }

        // Verify token belongs to this match (compare as strings)
        const tokenMatchId = tokenValidation.matchId.toString();
        const expectedMatchId = matchId.toString();
        if (tokenMatchId !== expectedMatchId) {
          return res.status(400).json({ 
            error: `Token ${tokenWithPrefix} does not belong to match ${matchId}` 
          });
        }
      }
    } catch (error) {
      console.error('Error validating tokens:', error);
      return res.status(500).json({ 
        error: 'Failed to validate tokens',
        details: error.message 
      });
    }

    const state = getSocketState();
    const io = getIO();
    const gameSession = state.gameSessions.get(matchId);

    console.log("Game session:", gameSession);

    // Check if game session exists and has players
    if (!gameSession) {
      return res.status(400).json({ 
        error: 'No players have joined this match yet. Players must connect via socket first.' 
      });
    }

    if (!gameSession.players || gameSession.players.size < 2) {
      return res.status(400).json({ 
        error: `Not enough players to start the match. Current players: ${gameSession.players?.size || 0}, required: 2` 
      });
    }

    const playerUUIDArray = Array.from(gameSession.players);
    console.log("Player UUIDs:", playerUUIDArray);

    // Determine players per team based on match type
    const playersPerTeam = Math.ceil(playerUUIDArray.length / 2);
    const blueTeam = playerUUIDArray.slice(0, playersPerTeam);
    const redTeam = playerUUIDArray.slice(playersPerTeam);

    // Emit to the server socket
    console.log("Emitting to server socket");
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
          matchId: matchIdAsId,
          status: 'started',
        },
        null // Match status updates might need auth, but for now allow unauthenticated
      );
    } catch (error) {
      console.error('Failed to update match status:', error);
      // Don't fail the request if status update fails
    }

    console.log("Match started (emit complete)");
    console.log({
      matchType: match.match_type || "pvp",
      playersPerTeam: playersPerTeam,
      blue_team: blueTeam,
      red_team: redTeam,
    });

    return res.status(200).json({ 
      success: true,
      matchType: match.match_type,
      blueTeam: blueTeam,
      redTeam: redTeam,
    });
  } catch (error) {
    console.error('Error starting match:', error);
    return res.status(500).json({ 
      error: 'Failed to start match',
      details: error.message 
    });
  }
});


// Setup the new match (legacy endpoint, consider using generate_tokens instead)
router.post("/setup", async (req, res) => {
    const { selectedMode } = req.body;
    const authToken = req.headers.authorization;

    if (!selectedMode) {
        return res.status(400).json({error: 'Missing selected mode'});
    }

    if (!authToken) {
        return res.status(401).json({ error: 'Missing authorization token' });
    }

    try {
        // Validate auth token and get user
        const user = await queryWithAuth(api.auth.validateAuthToken, {}, authToken);
        if (!user) {
            return res.status(401).json({ error: 'Invalid authorization token' });
        }

        // Create game teams
        const gameTeams = await mutateWithAuth(
            api.gameTeams.createGameTeamsForMatch,
            {
                redTeamBots: [],
                blueTeamBots: [],
            },
            authToken
        );

        // Create match
        const matchId = await mutateWithAuth(
            api.matches.createMatch,
            {
                matchType: selectedMode,
                matchStatus: 'waiting',
                blueTeamId: gameTeams.blueTeamId,
                redTeamId: gameTeams.redTeamId,
                mode: selectedMode,
            },
            authToken
        );

        // Generate tokens
        const selectedModeToTokenMap = {
            'pvp': 2,
            'bedwars': 8,
            'ctf': 10,
        };

        const tokens = [];
        for (let i = 0; i < selectedModeToTokenMap[selectedMode]; i++) {
            let token;
            let tokenCreated = false;
            do {
                token = uuidv4();
                try {
                    await mutateWithAuth(
                        api.tokens.createToken,
                        {
                            token: token,
                            userId: user.id,
                            matchId: matchId,
                            gameTeamId: gameTeams.redTeamId, // Default to red team for legacy endpoint
                            botId: null,
                        },
                        authToken
                    );
                    tokens.push(token);
                    tokenCreated = true;
                } catch (error) {
                    if (error.message && error.message.includes('already exists')) {
                        tokenCreated = false;
                    } else {
                        throw error;
                    }
                }
            } while (!tokenCreated);
        }

        console.log(`Match created with ID: ${matchId}`);
        console.log(`Tokens created: ${tokens.join(', ')}`);
        // Convert Convex ID to string for JSON response
        res.status(200).json({ tokens, matchId: matchId.toString() });

    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});


// {
//     "matchType": "pvp",
//     "playersPerTeam": 1,
//     "teams": [
//         {
//             "playerId": "uuid1"
//         },
//         {
//             "playerId": "uuid2"
//         }
//     ]
// }

export default router;