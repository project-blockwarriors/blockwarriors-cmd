// stats.js
import express from "express";
const router = express.Router();
import { convexClient, api } from "../convexClient.js";

// Example route for fetching stats
router.get("/", async (req, res) => {
  // TODO: Implement stats fetching via Convex
  // This is a placeholder that needs to be implemented
  // when stats are integrated with Convex
  res.json({ message: "Stats endpoint - not yet implemented in Convex schema" });
});

export default router;