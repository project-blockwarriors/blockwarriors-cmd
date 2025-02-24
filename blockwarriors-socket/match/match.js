// match.js
import express from 'express';
import supabase from '../supabaseClient.js';
import { getIO } from '../socket.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

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
    io.emit("startMatch", { message: "Match started" });
}

export default router;