import { createAppServer } from './server.js';

const PORT = process.env.PORT || 3000;

createAppServer(PORT);
