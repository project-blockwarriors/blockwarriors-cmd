## **User Story**

As a participant, I should be able to code a bot that can enter a duel arena, perceive the opponent and nearby terrain, manage its inventory and health, choose between bow and melee combat, place blocks for simple cover or positioning, and use healing items at the right time in order to win rounds.

A strong bot for this game would:

- approach or disengage based on distance and health
- use a bow at range and melee up close
- place blocks to create cover or deny enemy line of sight
- heal before it is too late
- navigate around arena cover and temporary player-built structures
- adapt between aggression and reset behavior during a fight

This is feasible for participants because the game has a clear progression of difficulty:

- **baseline bot**: move, aim, shoot, melee, heal
- **intermediate bot**: use cover, swap weapons intelligently, retreat/reset
- **advanced bot**: build reactively, punish movement, manage terrain and tempo

That means even a simpler bot can still function and compete, while stronger teams have room to differentiate themselves.

## **Format**

- **Primary format:** real-time 1v1
- **Optional extension:** 2v2 after the 1v1 mode works reliably
- **Round duration:** 5 minutes
- **Match structure:** best-of-3 or first-to-3 rounds

This should be synchronous, real-time play. Asynchronous play does not fit the design because the core challenge is live reaction, timing, and combat adaptation.

## **Arena and Environment**

The arena is a mirrored custom combat map designed for fairness and tactical decision-making.

### **Arena layout**

- one flat central lane for direct engagement
- side cover structures on both sides for resets, peeking, and repositioning
- mirrored spawns on opposite ends of the map
- no random terrain generation
- no item spawns during the round

### **Arena rules**

- center of arena fixed at given coordinates (X, Y, Z)
- players spawn at equal distance from the center
- block placement is enabled
- build height limit is capped at roughly **+12 to +16 blocks above floor level**
- broken blocks do not drop items
- arena resets between rounds

### **Environmental mechanics**

- temporary structures placed by bots are part of gameplay
- water and lava may be allowed as a configurable option
- for MVP, water is acceptable, lava is optional and likely better disabled at first

## **Inventory / Starting Kit**

Each player begins each round with a fixed kit. Suggested MVP loadout:

- sword
- bow
- arrows
- fishing rod
- blocks
- golden apples
- optional water bucket
- optional lava bucket

Recommended first version:

- iron or diamond sword
- 1 bow
- fixed arrow count
- 32 to 64 blocks
- 2 golden apples
- 1 fishing rod
- optionally 1 water bucket

Lava should probably be excluded from the first implementation because it adds a lot of bot complexity without being necessary for the game to be fun.

## **Core Gameplay Loop**

1. Bots spawn on opposite ends of the arena
2. They close distance, reposition, or take early bow shots
3. Bots decide whether to pressure, hold angles, or create cover with blocks
4. Mid-fight, they manage health and healing timing
5. The round ends when one player dies or time runs out

This creates a fight rhythm of:

- ranged opener
- spacing and pressure
- melee commit or reset
- healing and re-engage
- final chase or timeout resolution

## **Bot Requirements**

Bots should have access only to information a normal player could reasonably infer from gameplay plus standard internal state.

### **Information available to bots**

- visible opponent position and movement
- hotbar and inventory state
- health and armor state
- remaining consumables and ammo
- round timer / scoreboard
- visible arena geometry and placed blocks

### **Expected bot capabilities**

At minimum, bots should be able to:

- navigate toward the opponent
- navigate to cover or safer positions
- aim bow shots while moving
- choose between ranged and melee combat based on distance
- heal using golden apples before critical HP
- place simple blocks for cover or elevation
- avoid obviously bad movement, like walking into hazards

Advanced behavior may include:

- rod usage to interrupt or open melee
- walling to deny arrows
- simple high-ground creation
- water placement to prevent fall or lava damage
- block clutching and safer drops
- cutoff or trap logic

## **Winning Criteria**

A round is won by:

1. killing the opponent, or
2. having more remaining health when time expires

If health is tied at time expiry:

- **preferred option:** sudden death for 30 seconds with healing disabled
- **backup option:** rerun the round

A match winner is determined by round wins, for example best-of-3.

## **Why this game is good for a bot challenge**

This game is strong because it combines:

- combat mechanics
- movement and positioning
- lightweight environment manipulation
- resource management
- tactical decision-making under uncertainty

It is richer than a pure melee duel, but still far more scoped than a full survival or capture-the-flag system.

It also supports a nice difficulty ladder:

- weak bots can still fight
- decent bots can manage weapons and healing
- strong bots can use terrain and tempo intelligently

So the challenge is both accessible and deep.

## **Feasibility**

Yes, it is feasible for participants to build bots for this game.

Why:

- the game loop is compact
- there are only two players
- no economy, drafting, or large-team coordination is required
- no random item spawn logic is required
- map is static and mirrored
- a basic bot can already be competitive without solving every mechanic

The main reason this works well is that participants do **not** need to implement every advanced behavior for their bot to be valid. They can start with a simple combat bot and progressively improve it.

## **Recommended MVP Scope**

To keep the implementation realistic, the first version should include:

- 1v1 only
- sword, bow, arrows, blocks, golden apples
- mirrored arena with side cover
- real-time rounds
- health-based timeout win condition
- no dropped items
- no respawns during round

Optional mechanics like lava, advanced clutching, or 2v2 should be added only after the base mode is stable.