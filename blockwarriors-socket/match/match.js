// match.js
import express from 'express';
import supabase from '../supabaseClient.js';
import { getIO, getSocketState } from '../socket.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();


// Add from Next.js OLD api route: generate_tokens
router.post("/generate_tokens", async (req, res) => {
  console.log("REQUEST RECEIVED");
  const selectedMode = req.body.selectedMode;
  const user = await supabase.auth.getUser(req.headers.authorization);

  if (!selectedMode) {
    return new Response(JSON.stringify({ error: 'Missing selected mode' }), { status: 400 });
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

  // Create game_team 1 and game_team 2 
  const { data: gameTeamData, error: gameTeamError } = await supabase
    .from('game_teams2')
    .insert([{ bots: [1] }, { bots: [2] }]).select('game_team_id');
  
  if (gameTeamError) {
    console.log(gameTeamError);
    return new Response(JSON.stringify({ error: 'Failed to create game teams' }), { status: 500 });
  }
  
  console.log(gameTeamData)

  // New: Insert into matches2 table:
    const { data: matchData, error: matchError } = await supabase
    .from('matches2')
      .insert([{
        match_type: selectedMode,
        match_status: 'waiting',
        red_team_id: gameTeamData[0].game_team_id,
        blue_team_id: gameTeamData[1].game_team_id,
     }])
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

  // for (let i = 0; i < selectedModeToTokenMap[selectedMode]; i++) {
  //   // Ensure unique token
  //   do {
  //     token = uuidv4();
  //     const { error } = await supabase
  //       .from('active_tokens')
  //       .insert([{ token, match_id: matchId }]);
  //     tokenError = error;
  //   } while (tokenError);
  //   tokens.push(token);
  // }

  // Insert the required amount of tokens into each team
  for (let i = 0; i < selectedModeToTokenMap[selectedMode]/2; i++) {
    // Ensure unique token
    do {
    token = uuidv4();
      const { error } = await supabase
        .from('active_tokens2')
        .insert([{
          token: token,
          user_id: user.id,
          match_id: matchId,
          game_team_id: gameTeamData[0].game_team_id,

        }]);
    tokenError = error;
    console.log(error);
    } while (tokenError);
    tokens.push(token);
    console.log("pushing")
  }

    // Insert the required amount of tokens into each team
  for (let i = 0; i < selectedModeToTokenMap[selectedMode]/2; i++) {
    // Ensure unique token
    do {
    token = uuidv4();
      const { error } = await supabase
        .from('active_tokens2')
        .insert([{
          token: token,
          user_id: user.id,
          match_id: matchId,
          game_team_id: gameTeamData[1].game_team_id,

        }]);
      tokenError = error;
    } while (tokenError);
    tokens.push(token);
    console.log("pushing")
  }


  console.log(`Match created with ID: ${matchId}`);
  console.log(`Tokens created: ${tokens.join(', ')}`);
  // Log teams
  console.log(`Team 1 ID: ${gameTeamData[0].game_team_id}`);
  console.log(`Team 2 ID: ${gameTeamData[1].game_team_id}`);
  return res.status(200).send(JSON.stringify({ tokens, matchId }));
});



// Add from Next.js OLD api route: start_match
router.post("/start_match", async (req, res) => { 
  const tokens = req.body.tokens;
  console.log(tokens);

  // I'm given a list of tokens, I need to assoiciate each token
  // with a currently logged in user.
  // const user = await supabase.auth.getUser();
  

  const state = getSocketState();
  const io = state.io;
  const playerUUIDs = state.gameSessions.get(matchId).players
  // Validate whether there are enough logged in players to start the match
  if (playerUUIDs.length < 2) { 
    return new Response(JSON.stringify({ error: 'Not enough players to start the match' }), { status: 400 });
  }

  // Create an object from the set of strings in the form [{playerId: "uuid1"}, {playerId: "uuid2"}]
  const players = Array.from(playerUUIDs).map((playerId) => ({ playerId }));
  // Cut this in half
  const half = Math.ceil(players.length / 2);
  const team1 = players.slice(0, half);
  const team2 = players.slice(half);

  const playerNamespace = io.of("/player");
  // First argument should be a JSON object with the required data.
  io.emit("startMatch", {
    matchType: "pvp",
    playersPerTeam: 1,
    blue_team: team1, // list of {playerId: "uuid"} objects
    red_team: team2, // list of {playerId: "uuid"} objects
    });


});


// DOESNT NO ANYTHING Setup the new match
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