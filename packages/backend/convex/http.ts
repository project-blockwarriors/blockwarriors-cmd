import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

/**
 * Standardized API Response Format
 * 
 * All responses follow the format:
 * - Success: { success: true, data: T }
 * - Error:   { success: false, error: string }
 * 
 * This ensures consistent handling across all clients (Next.js, Beacon plugin, etc.)
 */

/**
 * Create a success response with the standardized format
 */
function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Create an error response with the standardized format
 */
function errorResponse(error: string, status = 400): Response {
  return new Response(
    JSON.stringify({ success: false, error }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Verify bearer token for server-to-server authentication (Minecraft beacon <-> Convex)
 * Returns true if the token is valid, false otherwise.
 */
function verifyBearerToken(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.substring(7);
  const secret = process.env.CONVEX_HTTP_SECRET;
  return !!secret && token === secret;
}

/**
 * Helper to return 401 Unauthorized response
 */
function unauthorizedResponse(): Response {
  return errorResponse("Unauthorized. Invalid or missing bearer token.", 401);
}

authComponent.registerRoutes(http, createAuth);

// GET /hello - Health check endpoint
http.route({
  path: "/hello",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("Hello, world!", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

// POST /matches/new - Create a new match (without tokens)
// Tokens will be generated when Minecraft server acknowledges the match
http.route({
  path: "/matches/new",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return errorResponse("Not authenticated. Please log in to create a match.", 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse("Invalid JSON in request body");
    }

    const { match_type, mode } = body;

    // Validate required fields
    if (!match_type || !mode) {
      return errorResponse("Missing required fields: match_type, mode");
    }

    try {
      // Create game teams (red and blue) with empty bot arrays
      const redTeamId = await ctx.runMutation(api.gameTeams.createGameTeam, {
        bots: [],
      });
      const blueTeamId = await ctx.runMutation(api.gameTeams.createGameTeam, {
        bots: [],
      });

      // Create match with "Queuing" status (no tokens yet)
      const matchId = await ctx.runMutation(api.matches.createMatch, {
        matchType: match_type,
        matchStatus: "Queuing",
        blueTeamId: blueTeamId,
        redTeamId: redTeamId,
        mode: mode,
        matchState: null, // Default to null, will be populated by telemetry service
      });

      // Get the created match to return full details
      const results = await ctx.runQuery(api.matches.getMatches, {
        matchIds: [matchId],
      });

      const match = results[matchId];
      if (!match) {
        return errorResponse("Failed to retrieve created match", 500);
      }

      return successResponse(match);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to create match: ${errorMessage}`, 500);
    }
  }),
});

// GET /matches - List matches or get match by ID
// Since Convex doesn't support path parameters, we handle both cases:
// - GET /matches?status=Queuing - List matches filtered by status
// - GET /matches?id={matchId} - Get single match by ID
http.route({
  path: "/matches",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const matchId = url.searchParams.get("id");
    const status = url.searchParams.get("status");

    // If id parameter is provided, get single match
    if (matchId && matchId.trim() !== "") {
      try {
        const results = await ctx.runQuery(api.matches.getMatches, {
          matchIds: [matchId as Id<"matches">],
        });

        const match = results[matchId];
        if (!match) {
          return errorResponse("Match not found", 404);
        }

        return successResponse(match);
      } catch (error) {
        // Handle invalid ID format - return 404 instead of 500
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const isValidationError =
          errorMessage.includes("ArgumentValidationError") ||
          errorMessage.includes("does not match validator") ||
          errorMessage.includes("Value does not match validator") ||
          (error instanceof Error && error.name === "ArgumentValidationError");

        if (isValidationError) {
          return errorResponse("Match not found", 404);
        }

        return errorResponse(`Failed to get match: ${errorMessage}`, 500);
      }
    }

    // Otherwise, list matches filtered by status
    try {
      const matches = await ctx.runQuery(api.matches.listMatchesByStatus, {
        status: status || undefined,
      });

      return successResponse(matches);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to list matches: ${errorMessage}`, 500);
    }
  }),
});

// POST /matches/acknowledge - Acknowledge a queued match and generate tokens
// Called by Minecraft server when it acknowledges a queued match
// Atomically updates match status to "Waiting" and generates tokens
http.route({
  path: "/matches/acknowledge",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse("Invalid JSON in request body");
    }

    const { match_id } = body;

    // Validate required fields
    if (!match_id) {
      return errorResponse("Missing required field: match_id");
    }

    try {
      // Atomically acknowledge match and generate tokens
      // Convex determines tokens_per_team from the match's match_type
      const result = await ctx.runMutation(
        api.matches.acknowledgeMatchAndGenerateTokens,
        {
          matchId: match_id as Id<"matches">,
        }
      );

      return successResponse(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it's a validation error
      if (
        errorMessage.includes("Match not found") ||
        errorMessage.includes("not in Queuing status")
      ) {
        return errorResponse(errorMessage);
      }

      return errorResponse(`Failed to acknowledge match: ${errorMessage}`, 500);
    }
  }),
});

// POST /matches/update - Update one or more matches
// Accepts { updates: [{ match_id, match_status?, match_state?, winner_player_id? }, ...] }
http.route({
  path: "/matches/update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse("Invalid JSON in request body");
    }

    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return errorResponse("Missing or empty 'updates' array in request body");
    }

    // Validate each update has match_id and at least one field to update
    for (const update of updates) {
      if (!update.match_id) {
        return errorResponse("Each update must have 'match_id'");
      }
      if (
        update.match_status === undefined &&
        update.match_state === undefined &&
        update.winner_player_id === undefined
      ) {
        return errorResponse(
          "Each update must have at least one of: match_status, match_state, winner_player_id"
        );
      }
    }

    try {
      // Transform to mutation args (snake_case -> camelCase)
      const mutationUpdates = updates.map(
        (u: {
          match_id: string;
          match_status?: string;
          match_state?: any;
          winner_player_id?: string;
        }) => ({
          matchId: u.match_id as Id<"matches">,
          matchStatus: u.match_status,
          matchState: u.match_state,
          winnerPlayerId: u.winner_player_id,
        })
      );

      const result = await ctx.runMutation(api.matches.updateMatches, {
        updates: mutationUpdates,
      });

      return successResponse(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to update matches: ${errorMessage}`, 500);
    }
  }),
});

// GET /matches/readiness - Check readiness for one or more matches
// Query: ?match_ids=id1,id2,id3
http.route({
  path: "/matches/readiness",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const matchIdsParam = url.searchParams.get("match_ids");

    if (!matchIdsParam || matchIdsParam.trim() === "") {
      return errorResponse("Missing 'match_ids' query parameter");
    }

    const matchIds = matchIdsParam.split(",").filter((id) => id.trim() !== "");
    if (matchIds.length === 0) {
      return errorResponse("Empty 'match_ids' parameter");
    }

    try {
      const readiness = await ctx.runQuery(api.tokens.checkReadiness, {
        matchIds: matchIds.map((id) => id as Id<"matches">),
      });

      return successResponse(readiness);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to check match readiness: ${errorMessage}`, 500);
    }
  }),
});

// GET /matches/tokens - Get tokens for one or more matches
// Query: ?match_ids=id1,id2,id3
http.route({
  path: "/matches/tokens",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const matchIdsParam = url.searchParams.get("match_ids");

    if (!matchIdsParam || matchIdsParam.trim() === "") {
      return errorResponse("Missing 'match_ids' query parameter");
    }

    const matchIds = matchIdsParam.split(",").filter((id) => id.trim() !== "");
    if (matchIds.length === 0) {
      return errorResponse("Empty 'match_ids' parameter");
    }

    try {
      const tokens = await ctx.runQuery(api.tokens.getTokens, {
        matchIds: matchIds.map((id) => id as Id<"matches">),
      });

      return successResponse(tokens);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to get tokens: ${errorMessage}`, 500);
    }
  }),
});

// GET /matches/info - Get one or more matches by IDs
// Query: ?match_ids=id1,id2,id3
http.route({
  path: "/matches/info",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const matchIdsParam = url.searchParams.get("match_ids");

    if (!matchIdsParam || matchIdsParam.trim() === "") {
      return errorResponse("Missing 'match_ids' query parameter");
    }

    const matchIds = matchIdsParam.split(",").filter((id) => id.trim() !== "");
    if (matchIds.length === 0) {
      return errorResponse("Empty 'match_ids' parameter");
    }

    try {
      const matches = await ctx.runQuery(api.matches.getMatches, {
        matchIds: matchIds.map((id) => id as Id<"matches">),
      });

      return successResponse(matches);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to get matches: ${errorMessage}`, 500);
    }
  }),
});

// POST /validateToken - Validate token and mark as used (Minecraft player login)
http.route({
  path: "/validateToken",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse("Invalid JSON in request body");
    }

    const { token, playerId, ign } = body as {
      token?: string;
      playerId?: string;
      ign?: string;
    };

    if (!token || !playerId) {
      return errorResponse("Missing required fields: token, playerId");
    }

    try {
      // Log token for debugging (first 8 chars only for security)
      const tokenPreview =
        token.length > 8 ? token.substring(0, 8) + "..." : token;
      console.log(
        `[Login] Validating token: ${tokenPreview} (length: ${token.length})`
      );

      // Validate token
      const validation = await ctx.runQuery(api.tokens.validateToken, {
        token: token,
      });

      if (!validation || !validation.valid) {
        return errorResponse(validation?.error || "Token validation failed");
      }

      // Mark token as used
      await ctx.runMutation(api.tokens.markTokenAsUsed, {
        token: token,
        playerId: playerId,
        ign: ign,
      });

      if (!validation.matchId) {
        return errorResponse("Match ID not found for token");
      }

      return successResponse({
        matchId: validation.matchId.toString(),
        gameTeamId: validation.gameTeamId?.toString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to process login: ${errorMessage}`, 500);
    }
  }),
});

// POST /tokens/clear - Clear token usage when player disconnects before match starts
// Only clears if match is in "Waiting" status - allows token to be reused
http.route({
  path: "/tokens/clear",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse("Invalid JSON in request body");
    }

    const { player_id, match_id } = body;

    if (!player_id || !match_id) {
      return errorResponse("Missing required fields: player_id, match_id");
    }

    try {
      const result = await ctx.runMutation(api.tokens.clearTokenUsage, {
        playerId: player_id,
        matchId: match_id as Id<"matches">,
      });

      if (!result.success) {
        // Return the error but with 200 status - this is expected behavior
        // (e.g., match is not in "Waiting" status)
        return successResponse(result);
      }

      return successResponse(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return errorResponse(`Failed to clear token: ${errorMessage}`, 500);
    }
  }),
});

export default http;
