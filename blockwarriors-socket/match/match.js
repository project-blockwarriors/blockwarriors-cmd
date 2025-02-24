// match.js
import express from 'express';
import { io } from '../server.js';
import supabase from '../supabaseClient.js';

const router = express.Router();
const playerNamespace = io.of("/player");

// Setup the new match
router.post("/setup", async (req, res) => {
  
});

// 

export default router;