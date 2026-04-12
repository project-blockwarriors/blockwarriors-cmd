import dotenv from "dotenv";
import { startConvexListener } from "./listener";

// Load your CONVEX_URL from .env
dotenv.config();

console.log("🤖 BlockWarriors Bot Orchestrator starting up...");

if (!process.env.CONVEX_URL) {
    console.error("❌ ERROR: CONVEX_URL is not defined in .env");
    process.exit(1);
}

// Start the real-time listener
startConvexListener();