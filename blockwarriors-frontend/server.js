const express = require('express');
const next = require('next');
const socketIO = require('socket.io');
const http = require('http');
const { createSupabaseClient } = require('./src/auth/server');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandle = nextApp.getRequestHandler();

const supabase = createSupabaseClient();

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app); // Create an HTTP server
  const io = socketIO(server); // Attach socket.io to the HTTP server

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

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});