import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import 'dotenv/config';

const app = express();
const server = createServer(app);

const io = new Server(server);

app.get('/', (req, res) => {
  res.send('<h1>Server is running</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});