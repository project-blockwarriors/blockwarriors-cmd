// Purpose: Handle the start_match API endpoint.
import { createSupabaseClient, getUser } from '@/auth/server';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';


// Internal API Endpoint: api/start_match
// Inputs: tokens, matchId, selectedMode, userId
export async function POST(req) {
    const supabase = await createSupabaseClient();
    const selectedMode = await req.json();

    // Connect to a socket.io server with a given URI
    const socket = io(process.env.EXPRESS_URI);
    socket.emit('start_match', { selectedMode });

    // Rest of the code...

}