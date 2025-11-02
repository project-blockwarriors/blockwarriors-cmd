import express from "express";
import { createServer } from "node:http";
import "dotenv/config";
import routes from "./routes.js";
import { initializeSocket } from "./socket.js";
import cors from "cors";

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

const server = createServer(app);

initializeSocket(server);

app.use(express.json());
app.use(routes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(
    `BlockWarriors Socket.IO server running at http://localhost:${PORT}`
  );
});
