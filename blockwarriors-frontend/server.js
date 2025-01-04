import express from 'express';
import next from 'next';
import { Server } from 'socket.io';
import http from 'http';
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load default .env first, env.local which will override any duplicate variables
dotenv.config()
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app); // Create an HTTP server
  const io = new Server(server); // Attach socket.io to the HTTP server

  // Handle socket.io connection
  io.on('connection', async (socket) => {
    console.log('A client connected');
    console.log("getting toen");

    console.log(socket.handshake.headers.authorization);
    console.log(socket.handshake.query);
    const token = socket.handshake.headers.authorization;
    console.log("The token is...: " + token);

    const { data, error } = await supabase
      .from('active_tokens')
      .select('*')
      .eq('token', token)
      .single();

    // Disconnect the user if the token is invalid.
    if (error || !data) {
      console.log('Invalid token');
      socket.disconnect();
      return;
    }

    console.log("User connected succesfully with token: " + token);

    // Handle socket.io events here

    socket.on('disconnect', () => {
      console.log('A client with token ' + token + ' disconnected');
    });
  });

  app.all('*', (req, res) => {
    return nextHandle(req, res);
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});