import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export interface Fighter {
  handle: string;
  fighterKey: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  tiersCleared: string[];
  createdAt: number;
}

export interface FightRecord {
  matchId: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  eloDelta: number;
  finishedAt: number;
}

interface Registry {
  fighters: Record<string, Fighter>;
  history: FightRecord[];
}

const DATA_DIR = path.join(os.homedir(), ".blockwarriors");
const REGISTRY_PATH = path.join(DATA_DIR, "prizefight.json");

export const REPLAY_DIR = path.join(DATA_DIR, "replays");

function load(): Registry {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  } catch {
    return { fighters: {}, history: [] };
  }
}

function save(registry: Registry): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function registerFighter(handle: string): Fighter {
  const registry = load();
  const existing = Object.values(registry.fighters).find(
    (f) => f.handle.toLowerCase() === handle.toLowerCase()
  );
  if (existing) return existing;

  const fighter: Fighter = {
    handle,
    fighterKey: `pf_${crypto.randomBytes(12).toString("hex")}`,
    elo: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    tiersCleared: [],
    createdAt: Date.now(),
  };
  registry.fighters[fighter.fighterKey] = fighter;
  save(registry);
  return fighter;
}

export function getFighter(fighterKey: string): Fighter | null {
  return load().fighters[fighterKey] ?? null;
}

export function getLadder(): Array<Pick<Fighter, "handle" | "elo" | "wins" | "losses">> {
  return Object.values(load().fighters)
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 20)
    .map(({ handle, elo, wins, losses }) => ({ handle, elo, wins, losses }));
}

const K = 32;

export function recordResult(
  fighterKey: string,
  matchId: string,
  opponent: string,
  opponentElo: number,
  result: "win" | "loss" | "draw",
  tierCleared?: string
): { elo: number; eloDelta: number } {
  const registry = load();
  const fighter = registry.fighters[fighterKey];
  if (!fighter) throw new Error(`Unknown fighter key`);

  const expected = 1 / (1 + 10 ** ((opponentElo - fighter.elo) / 400));
  const actual = result === "win" ? 1 : result === "loss" ? 0 : 0.5;
  const eloDelta = Math.round(K * (actual - expected));

  fighter.elo += eloDelta;
  if (result === "win") fighter.wins += 1;
  else if (result === "loss") fighter.losses += 1;
  else fighter.draws += 1;
  if (tierCleared && result === "win" && !fighter.tiersCleared.includes(tierCleared)) {
    fighter.tiersCleared.push(tierCleared);
  }
  registry.history.push({ matchId, opponent, result, eloDelta, finishedAt: Date.now() });
  save(registry);
  return { elo: fighter.elo, eloDelta };
}
