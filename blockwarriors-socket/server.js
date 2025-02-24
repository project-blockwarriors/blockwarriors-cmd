import express from "express";
import { createServer } from "node:http";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import routes from "./routes.js";
import { initializeSocket } from "./socket.js";

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(routes);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const io = initializeSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(
    `BlockWarriors Socket.IO server running at http://localhost:${PORT}`
  );
});

export { io };