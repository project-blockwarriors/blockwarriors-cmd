# Crystal Siege - BlockWarriors Game Design

A novel capture-and-collect game where teams compete to harvest crystals from a contested central zone while defending their vault.

---

## Game Overview

**Format:** 3v3 teams (6 tokens per match)

**Duration:** 5 minutes OR first team to 100 points

**Map:** Custom arena with 3 distinct zones

### Core Loop

1. Crystals spawn periodically in the central "Chaos Zone"
2. Players collect crystals by walking over them
3. Players deposit crystals at their team's Vault for points
4. Killing an enemy drops all crystals they're carrying
5. First to 100 points OR highest score at time limit wins

---

## Map Layout

```
        [RED VAULT]
            |
     [RED SPAWN AREA]
            |
    +---------------+
    |               |
    |  CHAOS ZONE   |  <-- Crystals spawn here
    |   (Center)    |
    |               |
    +---------------+
            |
    [BLUE SPAWN AREA]
            |
       [BLUE VAULT]
```

**Dimensions:** ~60x60 blocks arena

- **Team Spawn Areas:** Safe zones with no PvP (5 second immunity when spawning)
- **Vault:** 3x3 gold block platform - walk on it to deposit
- **Chaos Zone:** 30x30 central area where crystals spawn and PvP is enabled

---

## Crystal Mechanics

| Crystal Type | Spawn Rate | Points | Visual |

|--------------|------------|--------|--------|

| Common (White) | Every 5s | 1 pt | White Concrete |

| Rare (Blue) | Every 15s | 3 pts | Blue Concrete |

| Epic (Purple) | Every 45s | 10 pts | Purple Concrete |

- Crystals appear as floating blocks at Y+1 with particle effects
- Max 15 crystals in Chaos Zone at any time
- Player can carry unlimited crystals (no inventory limit)
- **Crystals carried** is tracked in player's XP bar display

---

## Combat Rules

- Standard Minecraft PvP (sword combat)
- All players spawn with: - Iron Sword - Iron Armor (full set) - 3 Golden Apples
- **On death:** Drop ALL carried crystals at death location
- **Respawn:** 5 seconds at team spawn with full gear reset
- **Kill reward:** Killer gains +2 bonus points directly

---

## Win Conditions

1. **Score Victory:** First team to reach 100 points
2. **Time Victory:** Highest score when 5-minute timer expires
3. **Tiebreaker:** Team with most recent point scored wins

---

## Client/Player Requirements

### What Teams Must Implement (Mineflayer Bot)

```javascript
// Key capabilities their bot needs:
1. Navigation
   - pathfindToBlock(x, y, z)  // Move to crystal locations
   - pathfindToVault()         // Return to deposit

2. Crystal Detection
   - getNearbyBlocks(['white_concrete', 'blue_concrete', 'purple_concrete'])
   - Listen for "crystal_spawned" chat message with coordinates

3. State Tracking
   - Read XP bar for crystals carried count
   - Track team score from scoreboard
   - Track enemy positions

4. Decision Making
   - When to collect vs deposit (risk/reward)
   - When to attack enemies carrying crystals
   - Which crystal types to prioritize
   - Team coordination (split up vs group)

5. Combat
   - Attack nearby enemies
   - Kite and retreat when low health
   - Target selection (high-crystal carriers)
```

### Information Available to Bots

- Chat messages announce crystal spawns with coordinates
- Scoreboard shows team scores
- XP bar shows crystals carried
- Compass points to nearest uncollected crystal
- Tab list shows all player positions (optional: enable/disable)

---

## Server Implementation (Minecraft Plugin)

### New Classes Required

```
ai.blockwarriors.games.crystalsiege/
├── CrystalSiegeGame.java        // Main game controller
├── CrystalSpawner.java          // Handles crystal spawn logic
├── VaultManager.java            // Deposit detection & scoring
├── CrystalSiegeScoreboard.java  // Score display
└── CrystalSiegeListener.java    // Event handlers
```

### Key Plugin Tasks

1.  **World Setup**

            - Generate flat arena with barriers
            - Place vault platforms (gold blocks)
            - Define Chaos Zone boundaries
            - Set spawn points for each team

2.  **Crystal Spawning**

            - Scheduled task every 5s/15s/45s
            - Random position within Chaos Zone
            - Place concrete block at Y+1 with ArmorStand marker
            - Broadcast coordinates in chat

3.  **Collection Detection**

            - PlayerMoveEvent: Check if player walks over crystal block
            - Remove block + ArmorStand
            - Increment player's crystal count (stored in metadata)
            - Update XP bar display

4.  **Deposit Detection**

            - PlayerMoveEvent: Check if player on vault platform
            - Convert carried crystals to team points
            - Reset player's crystal count
            - Update scoreboard

5.  **Death Handling**

            - PlayerDeathEvent: Spawn crystal blocks at death location
            - Award killer +2 points
            - Schedule respawn with gear reset

6.  **Game State Tracking**

            - Extend `match_state` telemetry with:

```json
{
  "gameType": "crystalsiege",
  "scores": { "red": 45, "blue": 52 },
  "timeRemaining": 180,
  "crystalsInPlay": 8,
  "players": [
    { "ign": "Bot1", "team": "red", "crystalsCarried": 5, "kills": 2 }
  ]
}
```

7.  **Win Detection**

            - Check score threshold (100) after each deposit
            - Timer task for 5-minute limit
            - Call `MatchManager.endMatch()` with winner

---

## Web Dashboard Additions

### Real-time Match View

- Live score display (Red: 45 | Blue: 52)
- Countdown timer
- Mini-map showing: - Player positions (colored dots) - Crystal locations (colored markers) - Vault locations
- Player cards showing crystals carried
- Kill feed
- Point history graph over time

---

## Why This Game Works for AI Competition

| Aspect | Why It's Good |

|--------|---------------|

| **Clear Objectives** | Collect crystals, deposit at vault - easy to understand |

| **Strategic Depth** | Risk/reward decisions, target prioritization, team coordination |

| **Measurable Progress** | Points accumulate visibly, clear winner at end |

| **Combat Integration** | Killing enemies is rewarded but not the only path to victory |

| **Pathfinding Challenge** | Navigate to spawns, return to vault, chase enemies |

| **Coordination Reward** | Teams that split roles (collector vs hunter) can excel |

| **Spectator Appeal** | Dramatic moments when player with many crystals is killed |

| **Bot-Friendly** | All information is programmatically accessible |

---

## Schema Changes

Add to `packages/backend/convex/schema.ts`:

```typescript
// In tokensPerTeamMap in matches.ts:
crystalsiege: 3,  // 3v3 format
```

Update match_type in match creation to support "crystalsiege".

---

## Implementation Priority

1. Arena world generation (flat + barriers + vaults)
2. Crystal spawning system
3. Collection + deposit mechanics
4. Scoreboard + XP bar display
5. Death/respawn handling
6. Telemetry updates for new game state
7. Win condition checks
8. Web dashboard visualization
