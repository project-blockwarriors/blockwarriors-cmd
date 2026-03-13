package ai.blockwarriors.beacon.arena;

import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.logging.Logger;

/**
 * Programmatic arena builder for Sky Tiles game mode.
 * 
 * Builds a floating tile grid arena with:
 * - Start platform with spawn points
 * - Multiple sections of disappearing tiles
 * - Checkpoint platforms
 * - Goal platform
 * - Void below for danger
 * 
 * Call build(world) to construct the arena at the origin.
 */
public class SkyTilesArenaBuilder {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    // Arena dimensions
    private static final int BASE_Y = 100;          // Height of the arena
    private static final int TILE_WIDTH = 11;       // Width of tile sections (odd for center)
    private static final int SECTION_LENGTH = 12;   // Length of each tile section
    private static final int GAP_BETWEEN = 3;       // Gap between sections
    
    // Materials
    private static final Material START_PLATFORM = Material.STONE_BRICKS;
    private static final Material CHECKPOINT_PLATFORM = Material.EMERALD_BLOCK;
    private static final Material GOAL_PLATFORM = Material.GOLD_BLOCK;
    private static final Material SPAWN_MARKER = Material.DIAMOND_BLOCK;
    private static final Material BARRIER = Material.BARRIER;
    
    // Tile colors for variety
    private static final Material[] TILE_MATERIALS = {
        Material.WHITE_CONCRETE,
        Material.LIGHT_BLUE_CONCRETE,
        Material.CYAN_CONCRETE,
        Material.BLUE_CONCRETE
    };
    
    private final Random random = new Random();
    
    /**
     * Result of building an arena, containing key locations.
     */
    public static class BuildResult {
        public final List<Location> blueSpawns = new ArrayList<>();
        public final Location goal;
        public final List<Location> checkpoints = new ArrayList<>();
        public final int voidLevel;
        public final ArenaBoundary boundaries;
        
        public BuildResult(Location goal, int voidLevel, ArenaBoundary boundaries) {
            this.goal = goal;
            this.voidLevel = voidLevel;
            this.boundaries = boundaries;
        }
    }
    
    /**
     * Build the Sky Tiles arena at the world origin.
     * 
     * @param world World to build in
     * @return BuildResult with spawn points, goal, checkpoints
     */
    public BuildResult build(World world) {
        return build(world, 0, 0);
    }
    
    /**
     * Build the Sky Tiles arena at specified coordinates.
     * 
     * @param world World to build in
     * @param originX X origin (center of arena width)
     * @param originZ Z origin (start of arena)
     * @return BuildResult with spawn points, goal, checkpoints
     */
    public BuildResult build(World world, int originX, int originZ) {
        LOGGER.info("Building Sky Tiles arena at " + originX + ", " + BASE_Y + ", " + originZ);
        
        int currentZ = originZ;
        int halfWidth = TILE_WIDTH / 2;
        
        // Calculate total length for boundaries
        int totalLength = 5 + GAP_BETWEEN + SECTION_LENGTH + GAP_BETWEEN + 
                         5 + GAP_BETWEEN + SECTION_LENGTH + GAP_BETWEEN + 5;
        
        // Create boundaries
        ArenaBoundary boundaries = new ArenaBoundary(
            originX - halfWidth - 5, BASE_Y - 20, originZ - 5,
            originX + halfWidth + 5, BASE_Y + 50, originZ + totalLength + 5
        );
        
        BuildResult result = new BuildResult(
            null, // Will be set when goal is built
            BASE_Y - 15, // Void level
            boundaries
        );
        
        // Clear the build area first
        clearArea(world, originX - halfWidth - 2, BASE_Y - 5, originZ - 2,
                 originX + halfWidth + 2, BASE_Y + 10, originZ + totalLength + 2);
        
        // === SECTION 1: Start Platform ===
        buildPlatform(world, originX, BASE_Y, currentZ, 7, 5, START_PLATFORM);
        
        // Spawn markers
        Location spawn1 = new Location(world, originX - 1, BASE_Y + 1, currentZ + 2);
        Location spawn2 = new Location(world, originX + 1, BASE_Y + 1, currentZ + 2);
        spawn1.setYaw(0); // Facing positive Z (toward goal)
        spawn2.setYaw(0);
        result.blueSpawns.add(spawn1);
        result.blueSpawns.add(spawn2);
        
        // Mark spawns
        setBlock(world, originX - 1, BASE_Y, currentZ + 2, SPAWN_MARKER);
        setBlock(world, originX + 1, BASE_Y, currentZ + 2, SPAWN_MARKER);
        
        currentZ += 5 + GAP_BETWEEN;
        
        // === SECTION 2: First Tile Section ===
        buildTileSection(world, originX, BASE_Y, currentZ, TILE_WIDTH, SECTION_LENGTH, 0.7);
        currentZ += SECTION_LENGTH + GAP_BETWEEN;
        
        // === SECTION 3: Checkpoint 1 ===
        buildPlatform(world, originX, BASE_Y, currentZ, 5, 5, CHECKPOINT_PLATFORM);
        Location checkpoint1 = new Location(world, originX, BASE_Y + 1, currentZ + 2);
        result.checkpoints.add(checkpoint1);
        currentZ += 5 + GAP_BETWEEN;
        
        // === SECTION 4: Second Tile Section (harder) ===
        buildTileSection(world, originX, BASE_Y, currentZ, TILE_WIDTH, SECTION_LENGTH, 0.5);
        currentZ += SECTION_LENGTH + GAP_BETWEEN;
        
        // === SECTION 5: Goal Platform ===
        buildPlatform(world, originX, BASE_Y, currentZ, 7, 5, GOAL_PLATFORM);
        
        // Goal location (center of goal platform)
        Location goal = new Location(world, originX, BASE_Y + 1, currentZ + 2);
        
        // Update result with actual goal
        BuildResult finalResult = new BuildResult(goal, result.voidLevel, result.boundaries);
        finalResult.blueSpawns.addAll(result.blueSpawns);
        finalResult.checkpoints.addAll(result.checkpoints);
        
        // Add decorative elements
        addDecorations(world, originX, originZ, totalLength, halfWidth);
        
        LOGGER.info("Sky Tiles arena built. Goal at " + goal.getBlockX() + ", " + 
                   goal.getBlockY() + ", " + goal.getBlockZ());
        
        return finalResult;
    }
    
    /**
     * Build a solid platform.
     */
    private void buildPlatform(World world, int centerX, int y, int startZ,
                               int width, int depth, Material material) {
        int halfWidth = width / 2;
        for (int x = centerX - halfWidth; x <= centerX + halfWidth; x++) {
            for (int z = startZ; z < startZ + depth; z++) {
                setBlock(world, x, y, z, material);
            }
        }
    }
    
    /**
     * Build a tile section with some gaps.
     * 
     * @param density 0.0 to 1.0, probability of tile existing
     */
    private void buildTileSection(World world, int centerX, int y, int startZ,
                                  int width, int depth, double density) {
        int halfWidth = width / 2;
        
        for (int x = centerX - halfWidth; x <= centerX + halfWidth; x++) {
            for (int z = startZ; z < startZ + depth; z++) {
                // Always have a path through the center
                boolean isCenter = Math.abs(x - centerX) <= 1;
                
                if (isCenter || random.nextDouble() < density) {
                    Material tile = TILE_MATERIALS[random.nextInt(TILE_MATERIALS.length)];
                    setBlock(world, x, y, z, tile);
                }
            }
        }
        
        // Ensure there's always a valid path (center line)
        for (int z = startZ; z < startZ + depth; z++) {
            if (getBlock(world, centerX, y, z).getType() == Material.AIR) {
                setBlock(world, centerX, y, z, TILE_MATERIALS[0]);
            }
        }
    }
    
    /**
     * Add decorative elements (barriers, lights, etc.)
     */
    private void addDecorations(World world, int centerX, int startZ, int length, int halfWidth) {
        // Add barrier walls on sides (invisible walls to prevent going too wide)
        for (int z = startZ - 2; z < startZ + length + 2; z++) {
            for (int y = BASE_Y; y < BASE_Y + 5; y++) {
                // Left barrier
                setBlock(world, centerX - halfWidth - 3, y, z, BARRIER);
                // Right barrier
                setBlock(world, centerX + halfWidth + 3, y, z, BARRIER);
            }
        }
        
        // Add some glowstone/sea lanterns for atmosphere
        for (int z = startZ; z < startZ + length; z += 8) {
            setBlock(world, centerX - halfWidth - 2, BASE_Y + 3, z, Material.SEA_LANTERN);
            setBlock(world, centerX + halfWidth + 2, BASE_Y + 3, z, Material.SEA_LANTERN);
        }
    }
    
    /**
     * Clear an area to air.
     */
    private void clearArea(World world, int x1, int y1, int z1, int x2, int y2, int z2) {
        for (int x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            for (int y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                for (int z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
                    setBlock(world, x, y, z, Material.AIR);
                }
            }
        }
    }
    
    private void setBlock(World world, int x, int y, int z, Material material) {
        world.getBlockAt(x, y, z).setType(material);
    }
    
    private Block getBlock(World world, int x, int y, int z) {
        return world.getBlockAt(x, y, z);
    }
    
    /**
     * Create an ArenaConfig from build results.
     */
    public ArenaConfig createConfig(BuildResult result, World world) {
        ArenaConfig.Builder builder = ArenaConfig.builder()
            .name("Sky Tiles Arena")
            .gameType("sky_tiles");
        
        // Add spawn points
        for (Location spawn : result.blueSpawns) {
            builder.addSpawn("blue_team", new SpawnPoint(
                spawn.getX(), spawn.getY(), spawn.getZ(),
                spawn.getYaw(), spawn.getPitch()
            ));
        }
        
        // Add boundaries
        builder.boundaries(result.boundaries);
        
        // Add objectives
        if (result.goal != null) {
            builder.addObjective("goal", new int[]{
                result.goal.getBlockX(),
                result.goal.getBlockY(), 
                result.goal.getBlockZ()
            });
        }
        
        for (int i = 0; i < result.checkpoints.size(); i++) {
            Location cp = result.checkpoints.get(i);
            builder.addObjective("checkpoint_" + (i + 1), new int[]{
                cp.getBlockX(), cp.getBlockY(), cp.getBlockZ()
            });
        }
        
        return builder.build();
    }
}
