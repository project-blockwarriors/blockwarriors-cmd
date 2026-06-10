import { ConvexHttpClient } from "convex/browser";
import { BotClient } from "@packages/bot-client";
import type { BotState } from "@packages/bot-client";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { TIERS, startHouseBehavior, type TierSpec } from "./houseBots.js";
import { REPLAY_DIR, type Fighter } from "./state.js";

export interface GatewayConfig {
  convexUrl: string;
  convexSiteUrl: string;
  convexHttpSecret: string;
  minecraftHost: string;
  minecraftPort: number;
  spectateBaseUrl: string;
}

export interface ActionLogEntry {
  t: number;
  actor: string;
  type: string;
  detail: string;
}

export interface MatchSession {
  matchId: string;
  fighterKey: string;
  handle: string;
  tier: TierSpec;
  playerBotId: string;
  playerIgn: string;
  houseBotId: string;
  playerTeamId: string;
  spectateUrl: string;
  status: "playing" | "finished" | "error";
  result?: { outcome: "win" | "loss" | "draw"; eloDelta?: number; detail: string };
  stopHouseBot: () => void;
  actionLog: ActionLogEntry[];
  startedAt: number;
}

export class ArenaError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfterS?: number
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ArenaGateway {
  private convex: ConvexHttpClient;
  private bots = new BotClient();
  private sessions = new Map<string, MatchSession>();
  private connectChain: Promise<unknown> = Promise.resolve();
  private loginWaiters = new Map<string, (msg: string) => void>();

  constructor(private config: GatewayConfig) {
    this.convex = new ConvexHttpClient(config.convexUrl);
    this.bots.setCallbacks(
      (botId, state) => this.onBotUpdate(botId, state),
      (botId, username, message) => this.onBotMessage(botId, username, message),
      () => {}
    );
  }

  // ---------- Convex helpers ----------

  private async siteGet(p: string): Promise<any> {
    const res = await fetch(this.config.convexSiteUrl + p, {
      headers: { Authorization: `Bearer ${this.config.convexHttpSecret}` },
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new ArenaError("CONVEX_ERROR", `GET ${p} -> ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
    }
    return json.data ?? json;
  }

  private async getMatch(matchId: string): Promise<any> {
    return this.siteGet(`/matches?id=${encodeURIComponent(matchId)}`);
  }

  // ---------- bot plumbing ----------

  private onBotUpdate(_botId: string, _state: BotState): void {}

  private onBotMessage(botId: string, username: string, message: string): void {
    const waiter = this.loginWaiters.get(botId);
    if (waiter && username === "Server") waiter(message);
    const session = this.sessionForBot(botId);
    if (session && username !== "Server") {
      this.logAction(session, username, "chat", message);
    }
  }

  private sessionForBot(botId: string): MatchSession | undefined {
    for (const s of this.sessions.values()) {
      if (s.playerBotId === botId || s.houseBotId === botId) return s;
    }
    return undefined;
  }

  /** Server kicks same-IP joins within ~4s (connection throttle) — serialize with a gap. */
  private queueConnect<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.connectChain.then(fn);
    this.connectChain = next.catch(() => {}).then(() => sleep(5000));
    return next;
  }

  /** Connect a bot and wait for Beacon's "Successfully logged in." confirmation. */
  private async connectAndLogin(botId: string, ign: string, token: string): Promise<void> {
    await this.queueConnect(async () => {
      const loginResult = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.loginWaiters.delete(botId);
          reject(new ArenaError("LOGIN_TIMEOUT", `${ign}: no login confirmation within 25s`));
        }, 25000);
        this.loginWaiters.set(botId, (msg) => {
          if (msg.includes("Successfully logged in")) {
            clearTimeout(timeout);
            this.loginWaiters.delete(botId);
            resolve();
          } else if (msg.includes("Failed to log in") || msg.includes("already logged in")) {
            clearTimeout(timeout);
            this.loginWaiters.delete(botId);
            reject(new ArenaError("LOGIN_REJECTED", `${ign}: ${msg}`));
          }
        });
      });
      await this.bots.createBot(botId, ign, token, this.config.minecraftHost, this.config.minecraftPort);
      await this.bots.waitForSpawn(botId, 30000);
      await loginResult;
    });
  }

  // ---------- public API ----------

  async createFight(fighter: Fighter, tierId: string): Promise<MatchSession> {
    const tier = TIERS[tierId];
    if (!tier) {
      throw new ArenaError("UNKNOWN_OPPONENT", `Unknown opponent "${tierId}". Available: ${Object.keys(TIERS).join(", ")}`);
    }
    const active = [...this.sessions.values()].find(
      (s) => s.fighterKey === fighter.fighterKey && s.status === "playing"
    );
    if (active) {
      throw new ArenaError("ALREADY_FIGHTING", `Finish match ${active.matchId} first (or call match_result on it).`);
    }

    // 1. create teams + match (same public mutations the test harness uses)
    const { blueTeamId, redTeamId } = (await this.convex.mutation(
      "gameTeams:createGameTeamsForMatch" as any,
      { redTeamBots: [], blueTeamBots: [] }
    )) as { blueTeamId: string; redTeamId: string };
    const matchId = (await this.convex.mutation("matches:createMatch" as any, {
      matchType: "pvp",
      matchStatus: "Queuing",
      blueTeamId,
      redTeamId,
      mode: "practice",
    })) as string;

    // 2. wait for Beacon acknowledge (Queuing -> Waiting)
    let match = await this.getMatch(matchId);
    const ackDeadline = Date.now() + 30000;
    while (match.match_status === "Queuing" && Date.now() < ackDeadline) {
      await sleep(2000);
      match = await this.getMatch(matchId);
    }
    if (match.match_status !== "Waiting") {
      throw new ArenaError(
        "ARENA_OFFLINE",
        `The arena server did not pick up the match (status: ${match.match_status}). It may be down or restarting.`,
        120
      );
    }

    // 3. fetch the one-time seat tokens
    const tokensByMatch = await this.siteGet(`/matches/tokens?match_ids=${matchId}`);
    const tokens: Array<{ token: string; game_team_id: string }> = tokensByMatch[matchId] ?? [];
    if (tokens.length < 2) throw new ArenaError("NO_TOKENS", "Expected 2 seat tokens");

    // 4. connect player bot then house bot (unique IGNs dodge the stale-login server bug)
    const suffix = crypto.randomBytes(2).toString("hex");
    const playerIgn = `${fighter.handle.replace(/[^A-Za-z0-9_]/g, "").slice(0, 11)}_${suffix}`.slice(0, 16);
    const houseIgn = `${tier.ign.slice(0, 11)}_${suffix}`.slice(0, 16);
    const playerBotId = `player_${matchId}`;
    const houseBotId = `house_${matchId}`;

    await this.connectAndLogin(playerBotId, playerIgn, tokens[0].token);
    await this.connectAndLogin(houseBotId, houseIgn, tokens[1].token);

    // 5. wait for Playing
    const playDeadline = Date.now() + 60000;
    match = await this.getMatch(matchId);
    while (match.match_status !== "Playing" && Date.now() < playDeadline) {
      await sleep(2000);
      match = await this.getMatch(matchId);
    }
    if (match.match_status !== "Playing") {
      this.teardownBots(playerBotId, houseBotId);
      throw new ArenaError("START_TIMEOUT", `Match never started (status: ${match.match_status})`);
    }

    const session: MatchSession = {
      matchId,
      fighterKey: fighter.fighterKey,
      handle: fighter.handle,
      tier,
      playerBotId,
      playerIgn,
      houseBotId,
      playerTeamId: tokens[0].game_team_id,
      spectateUrl: `${this.config.spectateBaseUrl}/dashboard/matches/${matchId}`,
      status: "playing",
      stopHouseBot: () => {},
      actionLog: [],
      startedAt: Date.now(),
    };
    session.stopHouseBot = startHouseBehavior(this.bots, houseBotId, tier.id);
    this.sessions.set(matchId, session);
    this.logAction(session, "arena", "match_start", `${fighter.handle} (${playerIgn}) vs ${tier.name} — ${tier.description}`);
    void this.watchUntilFinished(session);
    return session;
  }

  private async watchUntilFinished(session: MatchSession): Promise<void> {
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline && session.status === "playing") {
      await sleep(3000);
      let match;
      try {
        match = await this.getMatch(session.matchId);
      } catch {
        continue;
      }
      if (["Finished", "Terminated"].includes(match.match_status)) {
        const winnerTeam = match.winner_team_id ?? null;
        const outcome: "win" | "loss" | "draw" =
          winnerTeam == null ? "draw" : winnerTeam === session.playerTeamId ? "win" : "loss";
        this.finishSession(session, outcome, `match ${match.match_status}, winner_team=${winnerTeam ?? "none"}`);
        return;
      }
      // if the player bot died and got booted, beacon's quit-forfeit path resolves the match shortly after
    }
    if (session.status === "playing") {
      this.finishSession(session, "draw", "gateway watchdog: 5 minute cap reached");
    }
  }

  private finishSession(session: MatchSession, outcome: "win" | "loss" | "draw", detail: string): void {
    if (session.status !== "playing") return;
    session.status = "finished";
    session.result = { outcome, detail };
    session.stopHouseBot();
    this.logAction(session, "arena", "match_end", `${outcome.toUpperCase()} — ${detail}`);
    this.teardownBots(session.playerBotId, session.houseBotId);
    this.writeReplay(session);
  }

  private teardownBots(...botIds: string[]): void {
    for (const id of botIds) {
      try {
        this.bots.removeBot(id);
      } catch {
        // already gone
      }
    }
  }

  // ---------- in-match actions (the visiting agent's verbs) ----------

  getSession(matchId: string): MatchSession {
    const session = this.sessions.get(matchId);
    if (!session) throw new ArenaError("UNKNOWN_MATCH", `No session for match ${matchId}`);
    return session;
  }

  private requirePlaying(matchId: string): MatchSession {
    const session = this.getSession(matchId);
    if (session.status !== "playing") {
      throw new ArenaError("MATCH_OVER", `Match is ${session.status}: ${session.result?.detail ?? ""}. Call match_result.`);
    }
    return session;
  }

  look(matchId: string): any {
    const session = this.requirePlaying(matchId);
    const state = this.bots.getBotState(session.playerBotId);
    if (!state) throw new ArenaError("BOT_GONE", "Your fighter is no longer connected");
    this.logAction(session, session.handle, "look", "surveyed the arena");
    return this.observation(session, state);
  }

  private observation(session: MatchSession, state: BotState): any {
    return {
      you: {
        ign: state.ign,
        status: state.status,
        position: state.position
          ? { x: Math.round(state.position.x * 10) / 10, y: Math.round(state.position.y), z: Math.round(state.position.z * 10) / 10 }
          : null,
        health: state.health,
        currentAction: state.currentAction,
      },
      entities: state.nearbyEntities
        .filter((e) => e.distance <= 32)
        .slice(0, 20)
        .map((e) => ({
          id: e.id,
          name: e.displayName || e.name,
          isPlayer: e.isPlayer,
          distance: Math.round(e.distance * 10) / 10,
          position: { x: Math.round(e.position.x), y: Math.round(e.position.y), z: Math.round(e.position.z) },
          health: e.health,
        })),
      opponent: session.tier.name,
      match_status: session.status,
      elapsed_s: Math.round((Date.now() - session.startedAt) / 1000),
    };
  }

  async goto(matchId: string, x: number, y: number, z: number): Promise<any> {
    const session = this.requirePlaying(matchId);
    this.logAction(session, session.handle, "goto", `-> (${x}, ${y}, ${z})`);
    await this.bots.executeCommand(session.playerBotId, { type: "goto", payload: { x, y, z } });
    // wait for arrival (or 10s), then report a fresh observation
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      await sleep(500);
      const state = this.bots.getBotState(session.playerBotId);
      if (!state?.position) break;
      const d = Math.hypot(state.position.x - x, state.position.y - y, state.position.z - z);
      if (d < 2) break;
    }
    const state = this.bots.getBotState(session.playerBotId);
    if (!state) throw new ArenaError("BOT_GONE", "Your fighter is no longer connected");
    return this.observation(session, state);
  }

  async strike(matchId: string, entityId: number): Promise<any> {
    const session = this.requirePlaying(matchId);
    const state = this.bots.getBotState(session.playerBotId);
    const target = state?.nearbyEntities.find((e) => e.id === entityId);
    this.logAction(session, session.handle, "strike", `attacks ${target?.displayName || target?.name || `#${entityId}`}`);
    await this.bots.executeCommand(session.playerBotId, { type: "attack_entity", payload: { entityId } });
    await sleep(3000); // let the attack session land hits before reporting back
    const fresh = this.bots.getBotState(session.playerBotId);
    if (!fresh) throw new ArenaError("BOT_GONE", "Your fighter is no longer connected");
    return this.observation(session, fresh);
  }

  async evade(matchId: string): Promise<any> {
    const session = this.requirePlaying(matchId);
    const state = this.bots.getBotState(session.playerBotId);
    if (!state?.position) throw new ArenaError("BOT_GONE", "Your fighter is no longer connected");
    const threat = state.nearbyEntities.filter((e) => e.isPlayer).sort((a, b) => a.distance - b.distance)[0];
    let dx = 1, dz = 0;
    if (threat) {
      dx = state.position.x - threat.position.x;
      dz = state.position.z - threat.position.z;
      const n = Math.max(Math.hypot(dx, dz), 0.01);
      dx /= n; dz /= n;
    }
    this.logAction(session, session.handle, "evade", `retreats from ${threat?.name ?? "the unknown"}`);
    await this.bots.executeCommand(session.playerBotId, { type: "sprint", payload: { enabled: true } });
    return this.goto(matchId, state.position.x + dx * 10, state.position.y, state.position.z + dz * 10);
  }

  async say(matchId: string, message: string): Promise<void> {
    const session = this.requirePlaying(matchId);
    this.logAction(session, session.handle, "say", message);
    await this.bots.executeCommand(session.playerBotId, { type: "chat", payload: { message: message.slice(0, 100) } });
  }

  think(matchId: string, thought: string): void {
    const session = this.getSession(matchId);
    this.logAction(session, session.handle, "think", thought);
  }

  logAction(session: MatchSession, actor: string, type: string, detail: string): void {
    session.actionLog.push({ t: Date.now() - session.startedAt, actor, type, detail });
  }

  private writeReplay(session: MatchSession): void {
    try {
      fs.mkdirSync(REPLAY_DIR, { recursive: true });
      const file = path.join(REPLAY_DIR, `${session.matchId}.jsonl`);
      const lines = session.actionLog.map((e) => JSON.stringify(e)).join("\n");
      fs.writeFileSync(file, lines + "\n");
    } catch {
      // replay persistence is best-effort
    }
  }

  async shutdown(): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.status === "playing") {
        this.finishSession(session, "draw", "gateway shutdown");
      }
    }
  }
}
