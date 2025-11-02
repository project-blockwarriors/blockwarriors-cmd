// routes.js
import express from "express";
import { convexClient, api } from "./convexClient.js";

const router = express.Router();

// Import route modules
import matchRoutes from "./match/match.js";
import statsRoutes from "./stats/stats.js";

// Web response
router.get("/", (req, res) => {
  res.send("<h1>BlockWarriors Socket.IO Server</h1>");
});

// Test Convex connection endpoint
router.get("/test/convex", async (req, res) => {
  try {
    if (!process.env.CONVEX_URL) {
      return res.status(500).json({
        success: false,
        error: "CONVEX_URL environment variable is not set",
      });
    }

    // Call the example function from Convex
    const result = await convexClient.query(api.example.example);

    res.json({
      success: true,
      message: "Convex is accessible!",
      convexUrl: process.env.CONVEX_URL,
      result: result,
    });
  } catch (error) {
    console.error("Convex test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
});

// Middleware for logging requests to /api/match
router.use("/api/match", (req, res, next) => {
  console.log(`Match Route Accessed: ${req.method} ${req.url}`);
  next(); // Pass control to the next middleware or route handler
});

// Use route modules
router.use("/api/match", matchRoutes);
router.use("/api/stats", statsRoutes);

export default router;
