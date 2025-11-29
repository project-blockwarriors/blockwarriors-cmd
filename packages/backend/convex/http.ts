import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

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
  return new Response(
    JSON.stringify({ error: "Unauthorized. Invalid or missing bearer token." }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

authComponent.registerRoutes(http, createAuth);

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
      return new Response(
        JSON.stringify({
          error: "Not authenticated. Please log in to create a match.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { match_type, mode } = body;

    // Validate required fields
    if (!match_type || !mode) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: match_type, mode",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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
      const match = await ctx.runQuery(api.matches.getMatchById, {
        matchId: matchId,
      });

      if (!match) {
        return new Response(
          JSON.stringify({ error: "Failed to retrieve created match" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify(match), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return new Response(
        JSON.stringify({
          error: `Failed to create match: ${errorMessage}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
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
        const match = await ctx.runQuery(api.matches.getMatchById, {
          matchId: matchId as Id<"matches">,
        });

        if (!match) {
          return new Response(JSON.stringify({ error: "Match not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(match), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(JSON.stringify({ error: "Match not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            error: `Failed to get match: ${errorMessage}`,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Otherwise, list matches filtered by status
    try {
      const matches = await ctx.runQuery(api.matches.listMatchesByStatus, {
        status: status || undefined,
      });

      return new Response(JSON.stringify(matches), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return new Response(
        JSON.stringify({
          error: `Failed to list matches: ${errorMessage}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
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
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { match_id } = body;

    // Validate required fields
    if (!match_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: match_id",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it's a validation error
      if (
        errorMessage.includes("Match not found") ||
        errorMessage.includes("not in Queuing status")
      ) {
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          error: `Failed to acknowledge match: ${errorMessage}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// POST /matches/update - Update match status and/or state
// Since Convex doesn't support path parameters, we use a different path
// and include the match ID in the request body
http.route({
  path: "/matches/update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    try {
      const body = await request.json();
      const { match_id, match_status, match_state } = body;

      if (!match_id) {
        return new Response(
          JSON.stringify({ error: "Missing match_id in request body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // At least one field must be provided
      if (match_status === undefined && match_state === undefined) {
        return new Response(
          JSON.stringify({
            error: "Must provide at least one of: match_status, match_state",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Update match
      await ctx.runMutation(api.matches.updateMatch, {
        matchId: match_id as Id<"matches">,
        matchStatus: match_status,
        matchState: match_state,
      });

      // Get updated match to return
      const match = await ctx.runQuery(api.matches.getMatchById, {
        matchId: match_id as Id<"matches">,
      });

      if (!match) {
        return new Response(JSON.stringify({ error: "Match not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(match), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it's a validation error
      if (
        errorMessage.includes("Invalid status transition") ||
        errorMessage.includes("Match not found")
      ) {
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          error: `Failed to update match: ${errorMessage}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /matches/{_id}/readiness - Check if match is ready (all tokens used)
http.route({
  path: "/matches/readiness",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    try {
      const url = new URL(request.url);
      const matchId = url.searchParams.get("match_id");

      if (!matchId) {
        return new Response(
          JSON.stringify({ error: "Missing match_id parameter" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const readiness = await ctx.runQuery(api.tokens.checkMatchReadiness, {
        matchId: matchId as Id<"matches">,
      });

      return new Response(JSON.stringify(readiness), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to check match readiness: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /matches/{_id}/tokens - Get all tokens for a match
http.route({
  path: "/matches/tokens",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify bearer token for server-to-server auth
    if (!verifyBearerToken(request)) {
      return unauthorizedResponse();
    }

    try {
      const url = new URL(request.url);
      const matchId = url.searchParams.get("match_id");

      if (!matchId) {
        return new Response(
          JSON.stringify({ error: "Missing match_id parameter" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const tokens = await ctx.runQuery(api.tokens.getTokensByMatchId, {
        matchId: matchId as Id<"matches">,
      });

      return new Response(JSON.stringify(tokens), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to get tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// POST /matches/start - DEPRECATED: Use /matches/new instead
// This endpoint is kept for backward compatibility but should not be used
// New flow: Frontend calls /matches/new, then Minecraft server calls /matches/acknowledge
http.route({
  path: "/matches/start",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get authenticated user
      const user = await authComponent.getAuthUser(ctx);
      if (!user) {
        return new Response(
          JSON.stringify({
            error: "Not authenticated. Please log in to start a match.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const body = await request.json();
      const { gameType } = body as { gameType?: string };

      // Validate game type
      if (!gameType || typeof gameType !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing game type" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const tokensPerTeamMap: Record<string, number> = {
        pvp: 1,
        bedwars: 4,
        ctf: 5,
      };

      if (!(gameType in tokensPerTeamMap)) {
        return new Response(
          JSON.stringify({
            error: `Invalid game type: ${gameType}. Must be one of: ${Object.keys(tokensPerTeamMap).join(", ")}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create match with tokens
      // matchType = game type (pvp, bedwars, ctf)
      // mode = match mode (practice, ranked) - this endpoint is for practice matches
      const result = await ctx.runMutation(api.matches.createMatchWithTokens, {
        matchType: gameType,
        matchStatus: "Queuing",
        mode: "practice",
        userId: user._id,
        tokensPerTeam: tokensPerTeamMap[gameType],
      });

      return new Response(
        JSON.stringify({
          matchId: result.matchId.toString(),
          tokens: result.tokens,
          expiresAt: result.expiresAt,
          matchType: gameType,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to start match",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    try {
      const body = await request.json();
      const { token, playerId, ign } = body as {
        token?: string;
        playerId?: string;
        ign?: string;
      };

      if (!token || !playerId) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: token, playerId" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

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
        return new Response(
          JSON.stringify({
            status: "bad",
            error: validation?.error || "Token validation failed",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Mark token as used
      await ctx.runMutation(api.tokens.markTokenAsUsed, {
        token: token,
        playerId: playerId,
        ign: ign,
      });

      if (!validation.matchId) {
        return new Response(
          JSON.stringify({
            status: "bad",
            error: "Match ID not found for token",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: "ok",
          matchId: validation.matchId.toString(),
          gameTeamId: validation.gameTeamId?.toString(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          status: "bad",
          error: `Failed to process login: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
