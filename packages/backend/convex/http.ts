import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

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

// POST /matches/new - Create a new match
http.route({
  path: "/matches/new",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { match_type, mode, blue_team_id, red_team_id, match_state } = body;

      // Validate required fields
      if (!match_type || !mode || !blue_team_id || !red_team_id) {
        return new Response(
          JSON.stringify({
            error:
              "Missing required fields: match_type, mode, blue_team_id, red_team_id",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate team IDs are valid Convex IDs
      try {
        const blueTeamId = blue_team_id as Id<"game_teams">;
        const redTeamId = red_team_id as Id<"game_teams">;

        // Create match with "Queuing" status
        const matchId = await ctx.runMutation(api.matches.createMatch, {
          matchType: match_type,
          matchStatus: "Queuing",
          blueTeamId: blueTeamId,
          redTeamId: redTeamId,
          mode: mode,
          matchState: match_state,
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
        return new Response(
          JSON.stringify({
            error: `Invalid team ID format: ${error instanceof Error ? error.message : "Unknown error"}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to create match: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    try {
      const url = new URL(request.url);
      const matchId = url.searchParams.get("id");
      const status = url.searchParams.get("status") || undefined;

      // If id parameter is provided, get single match
      // Check for id first, before checking status
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
          // Convex validation errors can come in different formats
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorString =
            error instanceof Error
              ? JSON.stringify({
                  message: error.message,
                  name: error.name,
                  stack: error.stack,
                })
              : JSON.stringify(error);

          // Check for validation errors in various formats
          if (
            errorMessage.includes("ArgumentValidationError") ||
            errorMessage.includes("does not match validator") ||
            errorMessage.includes("Value does not match validator") ||
            errorString.includes("ArgumentValidationError") ||
            errorString.includes("does not match validator") ||
            errorString.includes("Value does not match validator") ||
            (error instanceof Error && error.name === "ArgumentValidationError")
          ) {
            return new Response(JSON.stringify({ error: "Match not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          // Re-throw if it's not a validation error
          throw error;
        }
      }

      // Otherwise, list matches filtered by status
      const matches = await ctx.runQuery(api.matches.listMatchesByStatus, {
        status: status || undefined,
      });

      return new Response(JSON.stringify(matches), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Check if it's a validation error for invalid match ID
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorString =
        error instanceof Error
          ? JSON.stringify({ message: error.message, name: error.name })
          : JSON.stringify(error);

      if (
        errorMessage.includes("ArgumentValidationError") ||
        errorMessage.includes("does not match validator") ||
        errorMessage.includes("Value does not match validator") ||
        errorString.includes("ArgumentValidationError") ||
        errorString.includes("does not match validator") ||
        (error instanceof Error && error.name === "ArgumentValidationError")
      ) {
        // For invalid ID format, return 404
        return new Response(JSON.stringify({ error: "Match not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          error: `Failed to process request: ${errorMessage}`,
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

export default http;
