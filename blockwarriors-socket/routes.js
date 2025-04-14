// routes.js
import express from "express";
const router = express.Router();

// Import route modules
import matchRoutes from './match/match.js';
import statsRoutes from './stats/stats.js';

// Web response
router.get("/", (req, res) => {
  res.send("<h1>BlockWarriors Socket.IO Server</h1>");
});


// Middleware for logging requests to /api/match
router.use("/api/match", (req, res, next) => {
  console.log(`Match Route Accessed: ${req.method} ${req.url}`);
  next(); // Pass control to the next middleware or route handler
});

// Use route modules
router.use("/api/match", matchRoutes);
router.use("/api/stats", statsRoutes);




// Helper function to validate game token and get match ID
async function validateToken(token) {
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from("active_tokens")
      .select("match_id")
      .eq("token", token)
      .single();

    if (tokenError) {
      console.error("Token validation error:", tokenError);
      return { valid: false, error: "Invalid token" };
    }

    if (!tokenData) {
      return { valid: false, error: "Token not found" };
    }

    return { valid: true, matchId: tokenData.match_id };
  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false, error: "Token validation failed" };
  }
}

export default router;
