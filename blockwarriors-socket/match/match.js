// match.js
import express from 'express';
import { convexClient, api } from '../convexClient.js';
import { getIO, getSocketState } from '../socket.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Add from Next.js OLD api route: generate_tokens
router.post("/generate_tokens", async (req, res) => {
  console.log("REQUEST RECEIVED");
  const selectedMode = req.body.selectedMode;
  const authToken = req.headers.authorization;

  if (!selectedMode) {
    return res.status(400).json({ error: 'Missing selected mode' });
  }

  // TODO: Validate user authentication using better-auth
  // For now, this is a placeholder that needs to be implemented
  // when auth/matches are integrated with Convex
  
  try {
    // TODO: Implement match creation via Convex
    // Example placeholder - replace with actual Convex mutation when schema is ready:
    // const matchId = await convexClient.mutation(api.matches.create, { 
    //   matchType: selectedMode,
    //   userId: user.id 
    // });
    // const tokens = await convexClient.mutation(api.tokens.generate, { 
    //   matchId,
    //   count: selectedModeToTokenMap[selectedMode]
    // });

    const selectedModeToTokenMap = {
      'pvp': 2,
      'bedwars': 8,
      'ctf': 10,
    };

    // Placeholder: Generate tokens locally for now
    // This should be replaced with Convex mutations when schema is ready
    const totalTokens = selectedModeToTokenMap[selectedMode];
    const matchId = uuidv4(); // Placeholder match ID
    
    // Generate tokens separated by teams
    const tokens = {
      team1: [],
      team2: []
    };
    
    // For team games, split tokens evenly between teams
    // For PvP (1v1), each team gets 1 token
    const tokensPerTeam = totalTokens / 2;
    
    for (let i = 0; i < tokensPerTeam; i++) {
      tokens.team1.push(uuidv4());
      tokens.team2.push(uuidv4());
    }

    console.warn("Match/token creation not yet implemented in Convex schema");
    console.log(`Match created with ID: ${matchId}`);
    console.log(`Tokens created - Team 1: ${tokens.team1.length}, Team 2: ${tokens.team2.length}`);
    
    return res.status(200).json({ tokens, matchId });
  } catch (error) {
    console.error('Error creating match:', error);
    return res.status(500).json({ error: 'Failed to create match' });
  }
});



// Add from Next.js OLD api route: start_match
router.post("/start_match", async (req, res) => { 
  const tokens = req.body.tokens;
  const matchId = req.body.matchId;
  console.log("REQUEST RECEIVED");
  console.log("Tokens: ", tokens);
  console.log("Match ID: ", matchId);
  console.log(tokens);

  // I'm given a list of tokens, I need to assoiciate each token
  // with a currently logged in user.
  // TODO: Get user from better-auth token validation
  

  const state = getSocketState();
  const io = getIO();
  const playerUUIDs = state.gameSessions.get(matchId)
  console.log("BELOW IS PLAYERUUIDS")
  console.log(playerUUIDs);

  //{
//   players: Set(2) {
//     '103576cf-f9f2-4f12-b5db-c471a3252dc6',
//     '7865141f-780a-4367-8896-85592e999263'
//   },
//   playerData: Map(0) {}
  // }
  // playerUUIDS is above, extract the players

  const playerUUIDArray = Array.from(playerUUIDs.players);
  console.log("ARRAY BELOW");
  console.log(playerUUIDArray);

  
  // Validate whether there are enough logged in players to start the match
  if (playerUUIDs.length < 2) { 
    return new Response(JSON.stringify({ error: 'Not enough players to start the match' }), { status: 400 });
  }

  // Create an object from the set of strings in the form [{playerId: "uuid1"}, {playerId: "uuid2"}]
  // const players = Array.from(playerUUIDs).map((playerId) => ({ playerId }));

  // console.log(players)
  // // Cut this in half
  // const half = Math.ceil(players.length / 2);
  // const team1 = players[0]
  // const team2 = players[1]
  

  // emit to the server socket
  console.log("emitting to server socket")
  io.emit("startMatch", {
    matchType: "pvp",
    playersPerTeam: 1,
    blue_team: [playerUUIDArray[0]], // list of {playerId: "uuid"} objects
    red_team: [playerUUIDArray[1]], // list of {playerId: "uuid"} objects
  });
  console.log("Match started (emit complete)");
  console.log ({
    matchType: "pvp",
    playersPerTeam: 1,
    blue_team: [playerUUIDs[0]], // list of {playerId: "uuid"} objects
    red_team: [playerUUIDs[1]], // list of {playerId: "uuid"} objects
  });


});


// DOESNT NO ANYTHING Setup the new match
router.post("/setup", async (req, res) => {
    const { selectedMode } = req.body;

    if (!selectedMode) {
        return res.status(400).json({error: 'Missing selected mode'});
    }

    try {
        // TODO: Implement match creation via Convex
        // This endpoint is deprecated but kept for compatibility
        // Use /generate_tokens instead
        
        const selectedModeToTokenMap = {
          'pvp': 2,
          'bedwars': 8,
          'ctf': 10,
        };

        // Placeholder: Generate tokens locally for now
        const matchId = uuidv4(); // Placeholder match ID
        const tokens = [];
        
        for (let i = 0; i < selectedModeToTokenMap[selectedMode]; i++) {
          tokens.push(uuidv4());
        }
    
        console.warn("Match/token creation not yet implemented in Convex schema");
        console.log(`Match created with ID: ${matchId}`);
        console.log(`Tokens created: ${tokens.join(', ')}`);
        res.status(200).json({ tokens, matchId });
    
      } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: 'Internal server error' });
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