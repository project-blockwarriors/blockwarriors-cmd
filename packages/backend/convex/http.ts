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

// GET /matches/{_id} - Get match by ID
http.route({
  path: "/matches/:id",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const matchId = pathParts[pathParts.length - 1] as
        | Id<"matches">
        | undefined;

      if (!matchId) {
        return new Response(JSON.stringify({ error: "Missing match ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const match = await ctx.runQuery(api.matches.getMatchById, {
        matchId: matchId,
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
      return new Response(
        JSON.stringify({
          error: `Failed to get match: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// POST /matches/{_id} - Update match status and/or state
http.route({
  path: "/matches/:id",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const matchId = pathParts[pathParts.length - 1] as
        | Id<"matches">
        | undefined;

      if (!matchId) {
        return new Response(JSON.stringify({ error: "Missing match ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await request.json();
      const { match_status, match_state } = body;

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
        matchId: matchId,
        matchStatus: match_status,
        matchState: match_state,
      });

      // Get updated match to return
      const match = await ctx.runQuery(api.matches.getMatchById, {
        matchId: matchId,
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
        JSON.stringify({ error: `Failed to update match: ${errorMessage}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /matches - List matches, optionally filtered by status
http.route({
  path: "/matches",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const status = url.searchParams.get("status") || undefined;

      const matches = await ctx.runQuery(api.matches.listMatchesByStatus, {
        status: status || undefined,
      });

      return new Response(JSON.stringify(matches), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to list matches: ${error instanceof Error ? error.message : "Unknown error"}`,
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
