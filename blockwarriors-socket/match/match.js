// match.js
import express from 'express';
import supabase from '../supabaseClient.js';
import { getIO } from '../socket.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();


// Add from Next.js OLD api route: generate_tokens
router.post("/generate_tokens", async (req, res) => {
  console.log("REQUEST RECEIVED")
  const { selectedMode, jwtToken } = await req.json();
  const user = await supabase.auth.getUser();
  
  if (!selectedMode) {
    return new Response(JSON.stringify({ error: 'Missing selected mode' }), { status: 400 });
  }

  // JWT token, (refresh token), -> 
  // const userId = (await getUser()).id;

  // Rewrite code below as SQL queries. 

  // Insert into matches table
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .insert([{ mode: selectedMode }])
    .select('match_id')
    .single();

  if (matchError) {
    console.log(matchError);
    return new Response(JSON.stringify({ error: 'Failed to create match' }), { status: 500 });
  }

  const matchId = matchData.match_id;
  let token;
  let tokenError;


  // TODO: Generate a dynamic number of tokens and add them.

  let tokens = [];
  
  let selectedModeToTokenMap = {
    'pvp': 2,
    'bedwars': 8,
    'ctf': 10,
  }

  for (let i = 0; i < selectedModeToTokenMap[selectedMode]; i++) {
    // Ensure unique token
    do {
      token = uuidv4();
      const { error } = await supabase
        .from('active_tokens')
        .insert([{ token, match_id: matchId }]);
      tokenError = error;
    } while (tokenError);
    tokens.push(token);
  }


  console.log(`Match created with ID: ${matchId}`);
  console.log(`Token created: ${token}`);
  return new Response(JSON.stringify({ tokens, matchId }), { status: 200 });
 });



// Add from Next.js OLD api route: start_match
router.post("/start_match", async (req, res) => { 
    const selectedMode = await req.json();

    // Connect to a socket.io server with a given URI
    const socket = io(process.env.EXPRESS_URI);

    // Rest of the code...
});


// Setup the new match
router.post("/setup", async (req, res) => {
    const { selectedMode } = req.body;

    if (!selectedMode) {
        return res.status(400).json({error: 'Missing selected mode'});
    }

    try {
        // Insert into matches table
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .insert([{ mode: selectedMode }])
          .select('match_id')
          .single();
    
        if (matchError) {
          console.log(matchError);
          return res.status(500).json({ error: 'Failed to create match' });
        }
    
        const matchId = matchData.match_id;
        let token;
        let tokenError;
        let tokens = [];
    
        const selectedModeToTokenMap = {
          'pvp': 2,
          'bedwars': 8,
          'ctf': 10,
        };
    
        // Generate tokens based on game mode
        for (let i = 0; i < selectedModeToTokenMap[selectedMode]; i++) {
          // Ensure unique token
          do {
            token = uuidv4();
            const { error } = await supabase
              .from('active_tokens')
              .insert([{ token, match_id: matchId }]);
            tokenError = error;
          } while (tokenError);
          tokens.push(token);
        }
    
        console.log(`Match created with ID: ${matchId}`);
        console.log(`Tokens created: ${tokens.join(', ')}`);
        res.status(200).json({ tokens, matchId });
    
      } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: 'Internal server error' });
      }

      
});

// Start the new match
function startMatch() { 
    const io = getIO();
    const playerNamespace = io.of("/player");
    // First argument should be a JSON object with the required data.
    io.emit("startMatch", {
      matchType: "pvp",
      playersPerTeam: 1,
      teams: [
        { playerId: "uuid1" },
        { playerId: "uuid2" },
      ],
      });
}


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