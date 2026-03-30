# Build UHC

A 1v1 duel combining melee, bow, building, rod play, and healing. Two players fight in a mirrored arena until one is eliminated or time runs out.

## Game Overview

| Detail | Value |
|--------|-------|
| Format | 1v1 |
| Duration | 5 minutes (300 seconds) |
| Countdown | 5 seconds (players frozen) |
| Map | Mirrored arena loaded from schematic (`builduhcmap1.schem`) |
| Teams | Blue vs Red |
| Disconnect | Instant forfeit — opponent wins immediately |
| Difficulty | Hard |

## Starting Kit

Every player spawns with the same fixed loadout:

| Slot | Item | Quantity |
|------|------|----------|
| 1 | Iron Sword | 1 |
| 2 | Bow | 1 |
| 3 | Arrow | 32 |
| 4 | Fishing Rod | 1 |
| 5 | Team-colored Concrete (Blue or Red) | 64 |
| 6 | Golden Apple | 2 |
| 7 | Water Bucket | 1 |

Players start at full health (20 HP), full hunger (20), and full saturation (20). All potion effects are cleared before the round.

## Core Gameplay Loop

1. Players spawn on opposite sides of the arena, frozen for a 5-second countdown
2. "FIGHT!" — PvP enables, freeze effects removed
3. Early bow trades and positioning
4. Build cover, create angles, deny pushes
5. Use golden apples to stay ahead in HP
6. First to kill the opponent wins

## Building Mechanics

- Block placement is enabled using team-colored concrete
- **Build height limit**: Y = 81 (16 blocks above the floor at Y 65)
- Only **player-placed blocks** can be broken — original arena blocks are indestructible
- Broken blocks **drop nothing** (keeps the arena clean)
- Placement above the build height limit is cancelled

## Win Conditions

The round resolves in this order:

1. **Kill** — first to eliminate the opponent wins
2. **Time expires** — if the 5-minute timer runs out, the player (team) with **higher total HP** wins
3. **Sudden death** — if HP is tied at time expiry, a 30-second sudden death phase begins:
   - **Golden apple consumption is blocked** (no healing)
   - After 30 seconds, higher HP wins
   - If HP is **still** tied after sudden death, **blue team wins** as the tiebreak

## Arena Configuration

The arena is defined in `apps/blockwarriors-beacon/src/main/resources/arenas/build_uhc.yml`:

- **Schematic**: `builduhcmap1.schem` pasted at origin `(0, 65, 0)`
- **Blue spawn**: `(25, 65, 0)` facing west
- **Red spawn**: `(-25, 65, 0)` facing east
- **Boundaries**: X: -40 to 40, Y: 50 to 81, Z: -40 to 40
- **Fallback**: if the schematic can't load, a procedural arena is generated with a flat stone floor (Y 64), stone-brick cover walls, and oak-plank mid walls

Configurable objectives in the arena YAML:

| Key | Default | Description |
|-----|---------|-------------|
| `time_limit_seconds` | 300 | Round duration before timeout |
| `build_height_limit` | 81 | Max Y for block placement |
| `sudden_death_seconds` | 30 | Duration of sudden death phase |

## Bot Strategy Guide

### Difficulty Ladder

| Level | Skills |
|-------|--------|
| **Baseline** | Move, aim, shoot, melee, heal |
| **Intermediate** | Use cover, swap weapons intelligently, retreat/reset, rod combos |
| **Advanced** | Build reactively, punish movement, manage terrain and tempo, block clutch |

### Key Bot Capabilities

**Navigation**
- Path toward the opponent for pressure
- Path to cover or safer positions for resets

**Combat**
- Bow aim while strafing at range
- Switch to melee when close
- Use fishing rod to break momentum and open combos

**Building**
- Place blocks for cover, quick elevation, and arrow blocking
- Block clutching and safe drops

**Item Management**
- Use golden apples proactively (don't wait until critical HP)
- Place water to reduce fall damage risk
- Track remaining arrows and switch to melee when out

### Information Available to Bots

- Opponent position and movement (whatever a normal player would see)
- Hotbar and inventory state
- Health, hunger, and armor indicators
- Round timer via scoreboard
- Visible arena geometry and placed blocks

## Implementation Reference

| Component | Path |
|-----------|------|
| Game logic | `apps/blockwarriors-beacon/.../game/impl/BuildUHCGame.java` |
| Event handling (blocks, healing) | `apps/blockwarriors-beacon/.../events/MatchEventListener.java` |
| Arena config | `apps/blockwarriors-beacon/src/main/resources/arenas/build_uhc.yml` |
| Arena schematic | `apps/blockwarriors-beacon/src/main/resources/schematics/builduhcmap1.schem` |
| Shared game metadata | `packages/shared/constants/game-config.json` |
| Generated Java constants | `apps/blockwarriors-beacon/.../constants/GameConfig.java` |

## Design Rationale

See [builduhcfleshedout.md](./builduhcfleshedout.md) for the original design spec, user story, feasibility analysis, and bot difficulty ladder that informed this implementation.
