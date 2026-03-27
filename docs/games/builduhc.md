# Build UHC duel

A 1v1 duel where you win by mixing melee, bow pressure, smart building, and healing timing.

**Game Overview**

Format: 1v1 (optional: 2v2)

Duration: 5 minutes per round

Map: Custom Arena with flat mid and side cover

[Server] The center of the arena is at (X, Y, Z)

![image.png](attachment:96797731-eef6-4829-89b2-be9f4facc6df:image.png)

Inventory

**Core Loop**

1. Players spawn on opposite sides
2. Early bow trades and positioning for first hit
3. Build to create angles, deny pushes, and reset fights
4. Use golden apples to stay ahead in HP
5. First to kill wins the round

**Building Mechanics**

- Block placement enabled
- Build height limit: Y + (configurable, recommend +12 to +16 above floor)
- No block drops on break (clean arena, less lag)
- Lava and water allowed (configurable)

**Combat Rules**

- Starting kit: sword, bow, rod, blocks, water, lava, golden apples
- On death: Drop NOTHING
- Respawn: No respawn until next round

**Round Win Conditions**

1. Kill the opponent
2. If time expires: player with higher remaining health wins
3. If tied: sudden death (no healing for 30s) or rerun (your choice)

**Bot Requirements**

Navigation

- Bots must path to opponent and to safe reset spots behind cover

Aiming and Pressure

- Bow aim while strafing
- Decide when to rod to break momentum vs commit to sword

Building and Terrain Use

- Place blocks for cover, quick elevation, and blocking arrows
- Block clutching and safe drops (basic)
- Optional: walling, blocking lava, and cutoffs (advanced)

Item Management

- Use golden apples proactively (not at 0.5 hearts)
- Place water to null lava and reduce fall damage risk
- Track arrows and switch to melee when out of ammo

**Information Available to Bots**

- Whatever a normal player screen would entail
- Hotbar + inventory state
- Health/armor indicators
- Scoreboard with round wins