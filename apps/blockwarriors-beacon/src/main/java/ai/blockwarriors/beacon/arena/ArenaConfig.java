package ai.blockwarriors.beacon.arena;

import java.util.*;

/**
 * Configuration for an arena, loaded from YAML files.
 * 
 * Contains all the information needed to set up a game arena:
 * - Name and game type
 * - Schematic file path
 * - Team spawn points
 * - Arena boundaries
 * - Game-specific objectives and markers
 */
public class ArenaConfig {
    
    /** Display name of the arena */
    private final String name;
    
    /** Game type this arena is for (e.g., "pvp", "sky_tiles") */
    private final String gameType;
    
    /** Path to the WorldEdit schematic file (relative to schematics folder) */
    private final String schematicPath;
    
    /** Spawn points by team name (e.g., "blue_team", "red_team") */
    private final Map<String, List<SpawnPoint>> spawns;
    
    /** Arena boundaries for out-of-bounds detection */
    private final ArenaBoundary boundaries;
    
    /** Game-specific objectives (e.g., flag locations, bed positions) */
    private final Map<String, Object> objectives;
    
    /** Resource spawn locations (for games with item spawning) */
    private final List<ResourceSpawn> resources;
    
    /** Special block locations (respawn anchors, objective blocks, etc.) */
    private final Map<String, List<SpawnPoint>> specialBlocks;
    
    /**
     * Create an arena configuration with all parameters.
     */
    public ArenaConfig(String name, String gameType, String schematicPath,
                       Map<String, List<SpawnPoint>> spawns, ArenaBoundary boundaries,
                       Map<String, Object> objectives, List<ResourceSpawn> resources,
                       Map<String, List<SpawnPoint>> specialBlocks) {
        this.name = name;
        this.gameType = gameType;
        this.schematicPath = schematicPath;
        this.spawns = spawns != null ? new HashMap<>(spawns) : new HashMap<>();
        this.boundaries = boundaries;
        this.objectives = objectives != null ? new HashMap<>(objectives) : new HashMap<>();
        this.resources = resources != null ? new ArrayList<>(resources) : new ArrayList<>();
        this.specialBlocks = specialBlocks != null ? new HashMap<>(specialBlocks) : new HashMap<>();
    }
    
    /**
     * Builder for creating ArenaConfig instances.
     */
    public static class Builder {
        private String name;
        private String gameType;
        private String schematicPath;
        private final Map<String, List<SpawnPoint>> spawns = new HashMap<>();
        private ArenaBoundary boundaries;
        private final Map<String, Object> objectives = new HashMap<>();
        private final List<ResourceSpawn> resources = new ArrayList<>();
        private final Map<String, List<SpawnPoint>> specialBlocks = new HashMap<>();
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder gameType(String gameType) {
            this.gameType = gameType;
            return this;
        }
        
        public Builder schematicPath(String path) {
            this.schematicPath = path;
            return this;
        }
        
        public Builder addSpawns(String team, List<SpawnPoint> points) {
            this.spawns.put(team, new ArrayList<>(points));
            return this;
        }
        
        public Builder addSpawn(String team, SpawnPoint point) {
            this.spawns.computeIfAbsent(team, k -> new ArrayList<>()).add(point);
            return this;
        }
        
        public Builder boundaries(ArenaBoundary boundaries) {
            this.boundaries = boundaries;
            return this;
        }
        
        public Builder addObjective(String key, Object value) {
            this.objectives.put(key, value);
            return this;
        }
        
        public Builder addResource(ResourceSpawn resource) {
            this.resources.add(resource);
            return this;
        }
        
        public Builder addSpecialBlock(String type, SpawnPoint location) {
            this.specialBlocks.computeIfAbsent(type, k -> new ArrayList<>()).add(location);
            return this;
        }
        
        public ArenaConfig build() {
            if (name == null || gameType == null) {
                throw new IllegalStateException("Arena name and gameType are required");
            }
            return new ArenaConfig(name, gameType, schematicPath, spawns, boundaries,
                    objectives, resources, specialBlocks);
        }
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    // ==================== Getters ====================
    
    public String getName() {
        return name;
    }
    
    public String getGameType() {
        return gameType;
    }
    
    public String getSchematicPath() {
        return schematicPath;
    }
    
    public boolean hasSchematic() {
        return schematicPath != null && !schematicPath.isEmpty();
    }
    
    /**
     * Get spawn points for a team.
     * 
     * @param team Team name (e.g., "blue_team", "red_team")
     * @return List of spawn points, or empty list if team not found
     */
    public List<SpawnPoint> getSpawns(String team) {
        return Collections.unmodifiableList(spawns.getOrDefault(team, Collections.emptyList()));
    }
    
    /**
     * Get all team names that have spawn points defined.
     */
    public Set<String> getTeamNames() {
        return Collections.unmodifiableSet(spawns.keySet());
    }
    
    /**
     * Get the first spawn point for a team.
     * Useful for 1v1 games where each team has one spawn.
     */
    public SpawnPoint getFirstSpawn(String team) {
        List<SpawnPoint> teamSpawns = spawns.get(team);
        return (teamSpawns != null && !teamSpawns.isEmpty()) ? teamSpawns.get(0) : null;
    }
    
    public ArenaBoundary getBoundaries() {
        return boundaries;
    }
    
    public boolean hasBoundaries() {
        return boundaries != null;
    }
    
    /**
     * Get a game-specific objective value.
     * 
     * @param key Objective key
     * @return Objective value, or null if not found
     */
    @SuppressWarnings("unchecked")
    public <T> T getObjective(String key) {
        return (T) objectives.get(key);
    }
    
    /**
     * Get all objectives.
     */
    public Map<String, Object> getObjectives() {
        return Collections.unmodifiableMap(objectives);
    }
    
    /**
     * Get resource spawns.
     */
    public List<ResourceSpawn> getResources() {
        return Collections.unmodifiableList(resources);
    }
    
    /**
     * Get special block locations by type.
     */
    public List<SpawnPoint> getSpecialBlocks(String type) {
        return Collections.unmodifiableList(
                specialBlocks.getOrDefault(type, Collections.emptyList()));
    }
    
    /**
     * Create a copy of this config with spawn points offset from an origin.
     * Useful when placing arenas at different locations in a world.
     */
    public ArenaConfig withOffset(double originX, double originY, double originZ) {
        Map<String, List<SpawnPoint>> offsetSpawns = new HashMap<>();
        for (Map.Entry<String, List<SpawnPoint>> entry : spawns.entrySet()) {
            List<SpawnPoint> offsetPoints = new ArrayList<>();
            for (SpawnPoint point : entry.getValue()) {
                offsetPoints.add(point.withOffset(originX, originY, originZ));
            }
            offsetSpawns.put(entry.getKey(), offsetPoints);
        }
        
        ArenaBoundary offsetBoundaries = boundaries != null
                ? boundaries.withOffset(originX, originY, originZ)
                : null;
        
        Map<String, List<SpawnPoint>> offsetSpecialBlocks = new HashMap<>();
        for (Map.Entry<String, List<SpawnPoint>> entry : specialBlocks.entrySet()) {
            List<SpawnPoint> offsetPoints = new ArrayList<>();
            for (SpawnPoint point : entry.getValue()) {
                offsetPoints.add(point.withOffset(originX, originY, originZ));
            }
            offsetSpecialBlocks.put(entry.getKey(), offsetPoints);
        }
        
        // Resources also need to be offset
        List<ResourceSpawn> offsetResources = new ArrayList<>();
        for (ResourceSpawn resource : resources) {
            offsetResources.add(resource.withOffset(originX, originY, originZ));
        }
        
        return new ArenaConfig(name, gameType, schematicPath, offsetSpawns, offsetBoundaries,
                objectives, offsetResources, offsetSpecialBlocks);
    }
    
    @Override
    public String toString() {
        return String.format("ArenaConfig{name='%s', gameType='%s', teams=%s, hasSchematic=%s}",
                name, gameType, spawns.keySet(), hasSchematic());
    }
    
    /**
     * Configuration for a resource spawn point.
     */
    public static class ResourceSpawn {
        private final String materialType;
        private final SpawnPoint location;
        private final int intervalSeconds;
        
        public ResourceSpawn(String materialType, SpawnPoint location, int intervalSeconds) {
            this.materialType = materialType;
            this.location = location;
            this.intervalSeconds = intervalSeconds;
        }
        
        public String getMaterialType() {
            return materialType;
        }
        
        public SpawnPoint getLocation() {
            return location;
        }
        
        public int getIntervalSeconds() {
            return intervalSeconds;
        }
        
        public ResourceSpawn withOffset(double originX, double originY, double originZ) {
            return new ResourceSpawn(materialType,
                    location.withOffset(originX, originY, originZ), intervalSeconds);
        }
    }
}
