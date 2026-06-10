import type { BotClient } from "@packages/bot-client";

export interface TierSpec {
  id: string;
  name: string;
  ign: string;
  elo: number;
  description: string;
}

export const TIERS: Record<string, TierSpec> = {
  tier0: {
    id: "tier0",
    name: "Punching Bag",
    ign: "PunchingBag",
    elo: 800,
    description: "Stands still. Land a killing blow to clear the tier.",
  },
  tier1: {
    id: "tier1",
    name: "Brawler",
    ign: "Brawler",
    elo: 950,
    description: "Attacks the nearest player on sight and never retreats.",
  },
  tier2: {
    id: "tier2",
    name: "Kiter",
    ign: "Kiter",
    elo: 1100,
    description: "Keeps its distance, strafes, and punishes face-tanking.",
  },
};

/**
 * Drives a house bot's behavior loop. Returns a stop function.
 * House bots use the same BotClient action vocabulary as visiting agents.
 */
export function startHouseBehavior(
  client: BotClient,
  botId: string,
  tier: string
): () => void {
  if (tier === "tier0") {
    return () => {};
  }

  // tier1 rebalance from live playtest: a 2.5s always-aggro loop beat LLM decision
  // latency 5 matches straight — first-rung house bots must be winnable.
  const tickMs = tier === "tier1" ? 5000 : 2500;
  const aggroRange = tier === "tier1" ? 12 : 64;

  const interval = setInterval(async () => {
    const state = client.getBotState(botId);
    if (!state || state.status !== "online" || !state.position) return;

    const players = state.nearbyEntities
      .filter((e) => e.isPlayer)
      .sort((a, b) => a.distance - b.distance);
    const target = players[0];
    if (!target || target.distance > aggroRange) return;

    try {
      if (tier === "tier1") {
        await client.executeCommand(botId, {
          type: "attack_entity",
          payload: { entityId: target.id },
        });
      } else if (tier === "tier2") {
        if (target.distance < 5) {
          const dx = state.position.x - target.position.x;
          const dz = state.position.z - target.position.z;
          const norm = Math.max(Math.hypot(dx, dz), 0.01);
          await client.executeCommand(botId, {
            type: "goto",
            payload: {
              x: state.position.x + (dx / norm) * 8,
              y: state.position.y,
              z: state.position.z + (dz / norm) * 8,
            },
          });
        } else if (target.distance < 9) {
          await client.executeCommand(botId, {
            type: "attack_entity",
            payload: { entityId: target.id },
          });
        }
      }
    } catch {
      // behavior loop must never crash the gateway
    }
  }, tickMs);

  return () => clearInterval(interval);
}
