import { ConvexHttpClient } from "convex/browser";

export interface MatchInfo {
  match_id: string;
  match_type: string;
  match_status: string;
  blue_team_id: string;
  red_team_id: string;
  mode: string;
  match_state?: unknown;
  winner_team_id?: string;
}

export interface TokenInfo {
  token: string;
  match_id: string;
  game_team_id: string;
  user_id?: string;
  ign?: string;
  is_active: boolean;
}

export interface ConvexTestClientConfig {
  convexUrl: string;
  convexSiteUrl: string;
  convexHttpSecret: string;
}

export class ConvexTestClient {
  private client: ConvexHttpClient;
  private siteUrl: string;
  private secret: string;

  constructor(config: ConvexTestClientConfig) {
    this.client = new ConvexHttpClient(config.convexUrl);
    this.siteUrl = config.convexSiteUrl.replace(/\/+$/, "");
    this.secret = config.convexHttpSecret;
  }

  private authHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.secret}`,
    };
  }

  private async httpGet(path: string): Promise<unknown> {
    const response = await fetch(`${this.siteUrl}${path}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GET ${path} failed (${response.status}): ${body}`);
    }
    return response.json();
  }

  private async httpPost(path: string, body: unknown): Promise<unknown> {
    const response = await fetch(`${this.siteUrl}${path}`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST ${path} failed (${response.status}): ${text}`);
    }
    return response.json();
  }

  async createGameTeams(): Promise<{ blueTeamId: string; redTeamId: string }> {
    // Use Convex SDK directly — no HTTP auth needed for mutations
    const result = (await this.client.mutation(
      "gameTeams:createGameTeamsForMatch" as any,
      { redTeamBots: [], blueTeamBots: [] }
    )) as { blueTeamId: string; redTeamId: string };
    return result;
  }

  async createMatch(
    matchType: string,
    mode: string,
    blueTeamId: string,
    redTeamId: string
  ): Promise<string> {
    // Use Convex SDK directly to bypass user auth on /matches/new
    const matchId = (await this.client.mutation(
      "matches:createMatch" as any,
      {
        matchType,
        matchStatus: "Queuing",
        blueTeamId,
        redTeamId,
        mode,
      }
    )) as string;
    return matchId;
  }

  async getMatch(matchId: string): Promise<MatchInfo> {
    const raw = (await this.httpGet(
      `/matches?id=${encodeURIComponent(matchId)}`
    )) as any;
    // API wraps in { success, data }
    const data = raw.data ?? raw;
    return data;
  }

  async getTokens(matchId: string): Promise<TokenInfo[]> {
    const raw = (await this.httpGet(
      `/matches/tokens?match_ids=${encodeURIComponent(matchId)}`
    )) as any;
    const data = raw.data ?? raw;
    // Tokens are keyed by matchId: { [matchId]: TokenInfo[] }
    if (data[matchId]) return data[matchId];
    if (Array.isArray(data)) return data;
    return [];
  }

  async waitForStatus(
    matchId: string,
    targetStatus: string,
    timeoutMs = 30000,
    pollIntervalMs = 2000
  ): Promise<MatchInfo> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const match = await this.getMatch(matchId);
      if (match.match_status === targetStatus) {
        return match;
      }
      if (
        match.match_status === "Terminated" ||
        match.match_status === "Finished"
      ) {
        if (match.match_status !== targetStatus) {
          throw new Error(
            `Match reached terminal status "${match.match_status}" while waiting for "${targetStatus}"`
          );
        }
        return match;
      }
      await sleep(pollIntervalMs);
    }

    const finalMatch = await this.getMatch(matchId);
    throw new Error(
      `Timed out waiting for status "${targetStatus}" (current: "${finalMatch.match_status}") after ${timeoutMs}ms`
    );
  }

  // ==================== Tournament Methods ====================

  async createTournament(
    gameType: string,
    createdBy: string = "test-user"
  ): Promise<string> {
    const tournamentId = (await this.client.mutation(
      "tournaments:createTournament" as any,
      {
        name: `Test Tournament ${Date.now()}`,
        description: "Automated test tournament",
        format: "round_robin",
        isOfficial: false,
        createdBy,
        minTeams: 2,
        maxTeams: 4,
        gameType,
        gamesPerMatch: 1,
      }
    )) as string;
    return tournamentId;
  }

  async joinTournament(tournamentId: string, teamId: string, userId: string = "test-user"): Promise<void> {
    await this.client.mutation(
      "tournaments:joinTournament" as any,
      { tournamentId, teamId, userId }
    );
  }

  async startTournament(tournamentId: string, userId: string = "test-user"): Promise<void> {
    await this.client.mutation(
      "tournaments:startTournament" as any,
      { tournamentId, userId }
    );
  }

  async createTournamentGame(
    tournamentMatchId: string,
    matchType: string = "auto",
    mode: string = "ranked"
  ): Promise<{ success: boolean; matchId?: string; error?: string }> {
    return (await this.client.mutation(
      "tournamentMatches:createTournamentGame" as any,
      { tournamentMatchId, matchType, mode }
    )) as { success: boolean; matchId?: string; error?: string };
  }

  async getTournamentBracket(tournamentId: string): Promise<any[]> {
    return (await this.client.query(
      "tournamentMatches:getTournamentBracket" as any,
      { tournamentId }
    )) as any[];
  }

  close() {
    // ConvexHttpClient doesn't need explicit cleanup, but keep for symmetry
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
