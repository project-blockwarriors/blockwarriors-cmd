import express from 'express';
import next from 'next';
import 'dotenv/config'
import { Server } from 'socket.io';
import http from 'http';
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log("SUPABASE URL");
console.log(process.env)
console.log(supabaseUrl);
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)

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
    const { token } = socket.handshake.query;

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

    // Handle socket.io events here

    socket.on('disconnect', () => {
      console.log('A client disconnected');
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