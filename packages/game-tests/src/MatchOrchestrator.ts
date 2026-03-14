import { BotClient } from "@packages/bot-client";
import { ConvexTestClient, type TokenInfo } from "./ConvexTestClient.js";

export interface BotScript {
  name: string;
  execute(
    botClient: BotClient,
    botId: string,
    context: MatchContext
  ): Promise<void>;
}

export interface MatchContext {
  matchId: string;
  team: "blue" | "red";
  token: string;
  opponentIgns: string[];
}

export interface MatchOrchestratorConfig {
  convexUrl: string;
  convexSiteUrl: string;
  convexHttpSecret: string;
  minecraftHost: string;
  minecraftPort: number;
}

export interface ScenarioResult {
  name: string;
  passed: boolean;
  matchId?: string;
  winnerTeam?: string;
  durationMs: number;
  error?: string;
  stages: StageResult[];
}

interface StageResult {
  name: string;
  durationMs: number;
  passed: boolean;
  error?: string;
}

export class MatchOrchestrator {
  private convex: ConvexTestClient;
  private botClient: BotClient;
  private host: string;
  private port: number;
  private stages: StageResult[] = [];

  constructor(config: MatchOrchestratorConfig) {
    this.convex = new ConvexTestClient({
      convexUrl: config.convexUrl,
      convexSiteUrl: config.convexSiteUrl,
      convexHttpSecret: config.convexHttpSecret,
    });
    this.botClient = new BotClient();
    this.host = config.minecraftHost;
    this.port = config.minecraftPort;
  }

  async runScenario(
    name: string,
    matchType: string,
    mode: string,
    scripts: { blue: BotScript[]; red: BotScript[] },
    assertResult?: (result: {
      matchId: string;
      finalStatus: string;
      winnerTeamId?: string;
      blueTeamId: string;
      redTeamId: string;
    }) => void,
    options?: {
      finishTimeoutMs?: number;
      spawnDelayMs?: number;
    }
  ): Promise<ScenarioResult> {
    const startTime = Date.now();
    this.stages = [];

    let matchId = "";
    let blueTeamId = "";
    let redTeamId = "";

    try {
      // Stage 1: Create match
      const { id, blue, red } = await this.stage(
        "Create match",
        async () => {
          const teams = await this.convex.createGameTeams();
          const id = await this.convex.createMatch(
            matchType,
            mode,
            teams.blueTeamId,
            teams.redTeamId
          );
          return { id, blue: teams.blueTeamId, red: teams.redTeamId };
        }
      );
      matchId = id;
      blueTeamId = blue;
      redTeamId = red;
      log(`Match created: ${matchId}`);

      // Stage 2: Wait for Beacon to acknowledge (Queuing → Waiting)
      await this.stage("Wait for Beacon acknowledgment", async () => {
        await this.convex.waitForStatus(matchId, "Waiting", 45000);
      });
      log("Match acknowledged — tokens generated");

      // Stage 3: Get tokens
      const tokens = await this.stage("Retrieve tokens", async () => {
        return await this.convex.getTokens(matchId);
      });
      log(`Retrieved ${tokens.length} tokens`);

      const blueTokens = tokens.filter(
        (t: TokenInfo) => t.game_team_id === blueTeamId
      );
      const redTokens = tokens.filter(
        (t: TokenInfo) => t.game_team_id === redTeamId
      );

      if (blueTokens.length !== scripts.blue.length) {
        throw new Error(
          `Expected ${scripts.blue.length} blue tokens, got ${blueTokens.length}`
        );
      }
      if (redTokens.length !== scripts.red.length) {
        throw new Error(
          `Expected ${scripts.red.length} red tokens, got ${redTokens.length}`
        );
      }

      // Stage 4: Spawn bots and login
      const botIds: string[] = [];

      await this.stage("Spawn bots and login", async () => {
        const allBotConfigs = [
          ...scripts.blue.map((_, i) => ({
            botId: `blue-${i}`,
            ign: `TestBlue${i}`,
            token: blueTokens[i].token,
          })),
          ...scripts.red.map((_, i) => ({
            botId: `red-${i}`,
            ign: `TestRed${i}`,
            token: redTokens[i].token,
          })),
        ];

        // Create bots one at a time with a delay to avoid connection throttling
        for (const cfg of allBotConfigs) {
          botIds.push(cfg.botId);
          await this.botClient.createBot(
            cfg.botId,
            cfg.ign,
            cfg.token,
            this.host,
            this.port
          );
          await this.botClient.waitForSpawn(cfg.botId, 30000);
          log(`${cfg.ign} spawned`);
          // Delay between connections to avoid server throttle
          if (cfg !== allBotConfigs[allBotConfigs.length - 1]) {
            await sleep(5000);
          }
        }

        // Wait for login chat commands to be sent (1s delay in BotClient)
        await sleep(3000);
      });
      log(`${botIds.length} bots spawned and logged in`);

      // Stage 5: Wait for match to start (Waiting → Playing)
      await this.stage("Wait for match to start", async () => {
        await this.convex.waitForStatus(matchId, "Playing", 45000);
      });
      log("Match is now Playing");

      // Stage 6: Execute bot scripts
      await this.stage("Execute bot scripts", async () => {
        const scriptPromises: Promise<void>[] = [];

        const blueIgns = scripts.blue.map((_, i) => `TestBlue${i}`);
        const redIgns = scripts.red.map((_, i) => `TestRed${i}`);

        for (let i = 0; i < scripts.blue.length; i++) {
          const context: MatchContext = {
            matchId,
            team: "blue",
            token: blueTokens[i].token,
            opponentIgns: redIgns,
          };
          scriptPromises.push(
            scripts.blue[i].execute(this.botClient, `blue-${i}`, context)
          );
        }

        for (let i = 0; i < scripts.red.length; i++) {
          const context: MatchContext = {
            matchId,
            team: "red",
            token: redTokens[i].token,
            opponentIgns: blueIgns,
          };
          scriptPromises.push(
            scripts.red[i].execute(this.botClient, `red-${i}`, context)
          );
        }

        await Promise.all(scriptPromises);
      });
      log("Bot scripts completed");

      // Stage 7: Wait for match to finish
      const finishTimeout = options?.finishTimeoutMs ?? 120000;
      const finalMatch = await this.stage("Wait for match to finish", async () => {
        return await this.convex.waitForStatus(matchId, "Finished", finishTimeout);
      });
      log(`Match finished — winner: ${finalMatch.winner_team_id || "none"}`);

      // Stage 8: Assert result
      if (assertResult) {
        await this.stage("Assert result", async () => {
          assertResult({
            matchId,
            finalStatus: finalMatch.match_status,
            winnerTeamId: finalMatch.winner_team_id,
            blueTeamId,
            redTeamId,
          });
        });
      }

      return {
        name,
        passed: true,
        matchId,
        winnerTeam: finalMatch.winner_team_id,
        durationMs: Date.now() - startTime,
        stages: this.stages,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        name,
        passed: false,
        matchId: matchId || undefined,
        durationMs: Date.now() - startTime,
        error: errMsg,
        stages: this.stages,
      };
    } finally {
      this.botClient.removeAllBots();
      this.convex.close();
    }
  }

  private async stage<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.stages.push({
        name,
        durationMs: Date.now() - start,
        passed: true,
      });
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.stages.push({
        name,
        durationMs: Date.now() - start,
        passed: false,
        error: errMsg,
      });
      throw error;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string) {
  const time = new Date().toISOString().slice(11, 19);
  console.log(`  [${time}] ${message}`);
}
