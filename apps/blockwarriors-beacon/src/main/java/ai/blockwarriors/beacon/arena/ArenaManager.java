package ai.blockwarriors.beacon.arena;

import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;
import java.io.InputStream;
import java.util.*;
import java.util.logging.Logger;

/**
 * Manages arena configurations and schematic loading.
 * 
 * Arenas are defined in YAML files in the arenas/ resource folder.
 * Each arena config specifies:
 * - Spawn points for each team
 * - Arena boundaries
 * - Game-specific objectives
 * - Optional schematic file path
 * 
 * Usage:
 * <pre>
 * ArenaManager arenaManager = new ArenaManager(plugin);
 * arenaManager.loadArenas();
 * 
 * ArenaConfig config = arenaManager.getArena("pvp");
 * List<SpawnPoint> blueSpawns = config.getSpawns("blue_team");
 * </pre>
 */
public class ArenaManager {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    /** Directory containing arena YAML configs (in resources) */
    private static final String ARENAS_FOLDER = "arenas";
    
    /** Directory containing schematic files (in plugin data folder) */
    private static final String SCHEMATICS_FOLDER = "schematics";
    
    private final JavaPlugin plugin;
    
    /** Loaded arena configurations by name */
    private final Map<String, ArenaConfig> arenas = new HashMap<>();
    
    /** Arena configs by game type (multiple arenas per game type allowed) */
    private final Map<String, List<ArenaConfig>> arenasByGameType = new HashMap<>();
    
    /**
     * Create an ArenaManager.
     * 
     * @param plugin The JavaPlugin instance
     */
    public ArenaManager(JavaPlugin plugin) {
        this.plugin = plugin;
    }
    
    /**
     * Load all arena configurations from the arenas/ resource folder.
     * Also copies default configs to the plugin data folder if they don't exist.
     */
    public void loadArenas() {
        arenas.clear();
        arenasByGameType.clear();
        
        // Ensure directories exist
        File arenasDir = new File(plugin.getDataFolder(), ARENAS_FOLDER);
        File schematicsDir = new File(plugin.getDataFolder(), SCHEMATICS_FOLDER);
        
        if (!arenasDir.exists()) {
            arenasDir.mkdirs();
            LOGGER.info("Created arenas directory: " + arenasDir.getPath());
        }
        
        if (!schematicsDir.exists()) {
            schematicsDir.mkdirs();
            LOGGER.info("Created schematics directory: " + schematicsDir.getPath());
        }
        
        // Save default arena configs from resources
        saveDefaultArenas();
        
        // Load all YAML files from the arenas directory
        File[] arenaFiles = arenasDir.listFiles((dir, name) -> name.endsWith(".yml") || name.endsWith(".yaml"));
        
        if (arenaFiles == null || arenaFiles.length == 0) {
            LOGGER.warning("No arena configuration files found in " + arenasDir.getPath());
            return;
        }
        
        for (File file : arenaFiles) {
            try {
                ArenaConfig config = loadArenaFile(file);
                if (config != null) {
                    registerArena(config);
                }
            } catch (Exception e) {
                LOGGER.severe("Failed to load arena file " + file.getName() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        LOGGER.info("Loaded " + arenas.size() + " arena configurations");
    }
    
    /**
     * Save default arena configurations from resources to the plugin data folder.
     */
    private void saveDefaultArenas() {
        // List of default arena configs to save
        String[] defaultArenas = {"pvp.yml", "bridge.yml", "ctf.yml"};
        
        for (String arenaName : defaultArenas) {
            String resourcePath = ARENAS_FOLDER + "/" + arenaName;
            File targetFile = new File(plugin.getDataFolder(), resourcePath);
            
            if (!targetFile.exists()) {
                try (InputStream in = plugin.getResource(resourcePath)) {
                    if (in != null) {
                        plugin.saveResource(resourcePath, false);
                        LOGGER.info("Saved default arena config: " + arenaName);
                    }
                } catch (Exception e) {
                    LOGGER.warning("Could not save default arena " + arenaName + ": " + e.getMessage());
                }
            }
        }
    }
    
    /**
     * Load an arena configuration from a YAML file.
     */
    private ArenaConfig loadArenaFile(File file) {
        YamlConfiguration yaml = YamlConfiguration.loadConfiguration(file);
        
        String name = yaml.getString("name");
        String gameType = yaml.getString("game_type");
        
        if (name == null || gameType == null) {
            LOGGER.warning("Arena file " + file.getName() + " missing required 'name' or 'game_type'");
            return null;
        }
        
        ArenaConfig.Builder builder = ArenaConfig.builder()
                .name(name)
                .gameType(gameType)
                .schematicPath(yaml.getString("schematic"));
        
        // Load spawns
        ConfigurationSection spawnsSection = yaml.getConfigurationSection("spawns");
        if (spawnsSection != null) {
            for (String teamName : spawnsSection.getKeys(false)) {
                List<SpawnPoint> spawnPoints = loadSpawnPoints(spawnsSection, teamName);
                if (!spawnPoints.isEmpty()) {
                    builder.addSpawns(teamName, spawnPoints);
                }
            }
        }
        
        // Load boundaries
        ConfigurationSection boundariesSection = yaml.getConfigurationSection("boundaries");
        if (boundariesSection != null) {
            ArenaBoundary boundary = loadBoundary(boundariesSection);
            if (boundary != null) {
                builder.boundaries(boundary);
            }
        }
        
        // Load objectives
        ConfigurationSection objectivesSection = yaml.getConfigurationSection("objectives");
        if (objectivesSection != null) {
            for (String key : objectivesSection.getKeys(false)) {
                Object value = objectivesSection.get(key);
                builder.addObjective(key, value);
            }
        }
        
        // Load resources
        List<Map<?, ?>> resourcesList = yaml.getMapList("resources");
        for (Map<?, ?> resourceMap : resourcesList) {
            ArenaConfig.ResourceSpawn resource = loadResource(resourceMap);
            if (resource != null) {
                builder.addResource(resource);
            }
        }
        
        // Load special blocks
        ConfigurationSection specialBlocksSection = yaml.getConfigurationSection("special_blocks");
        if (specialBlocksSection != null) {
            for (String blockType : specialBlocksSection.getKeys(false)) {
                List<SpawnPoint> locations = loadSpawnPoints(specialBlocksSection, blockType);
                for (SpawnPoint loc : locations) {
                    builder.addSpecialBlock(blockType, loc);
                }
            }
        }
        
        LOGGER.info("Loaded arena: " + name + " (type: " + gameType + ")");
        return builder.build();
    }
    
    /**
     * Load spawn points from a configuration section.
     */
    private List<SpawnPoint> loadSpawnPoints(ConfigurationSection parent, String key) {
        List<SpawnPoint> points = new ArrayList<>();
        
        // Can be a list of maps or a single map
        if (parent.isList(key)) {
            List<Map<?, ?>> spawnList = parent.getMapList(key);
            for (Map<?, ?> spawnMap : spawnList) {
                SpawnPoint point = parseSpawnPoint(spawnMap);
                if (point != null) {
                    points.add(point);
                }
            }
        } else if (parent.isConfigurationSection(key)) {
            // Single spawn point as a section
            ConfigurationSection spawnSection = parent.getConfigurationSection(key);
            if (spawnSection != null) {
                SpawnPoint point = parseSpawnPointFromSection(spawnSection);
                if (point != null) {
                    points.add(point);
                }
            }
        }
        
        return points;
    }
    
    /**
     * Parse a spawn point from a map.
     */
    private SpawnPoint parseSpawnPoint(Map<?, ?> map) {
        try {
            double x = getDouble(map, "x", 0);
            double y = getDouble(map, "y", 64);
            double z = getDouble(map, "z", 0);
            float yaw = (float) getDouble(map, "yaw", 0);
            float pitch = (float) getDouble(map, "pitch", 0);
            
            return new SpawnPoint(x, y, z, yaw, pitch);
        } catch (Exception e) {
            LOGGER.warning("Failed to parse spawn point: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Parse a spawn point from a configuration section.
     */
    private SpawnPoint parseSpawnPointFromSection(ConfigurationSection section) {
        try {
            double x = section.getDouble("x", 0);
            double y = section.getDouble("y", 64);
            double z = section.getDouble("z", 0);
            float yaw = (float) section.getDouble("yaw", 0);
            float pitch = (float) section.getDouble("pitch", 0);
            
            return new SpawnPoint(x, y, z, yaw, pitch);
        } catch (Exception e) {
            LOGGER.warning("Failed to parse spawn point section: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Load boundary configuration.
     */
    private ArenaBoundary loadBoundary(ConfigurationSection section) {
        try {
            ConfigurationSection minSection = section.getConfigurationSection("min");
            ConfigurationSection maxSection = section.getConfigurationSection("max");
            
            if (minSection == null || maxSection == null) {
                return null;
            }
            
            double minX = minSection.getDouble("x");
            double minY = minSection.getDouble("y");
            double minZ = minSection.getDouble("z");
            double maxX = maxSection.getDouble("x");
            double maxY = maxSection.getDouble("y");
            double maxZ = maxSection.getDouble("z");
            
            return new ArenaBoundary(minX, minY, minZ, maxX, maxY, maxZ);
        } catch (Exception e) {
            LOGGER.warning("Failed to parse boundary: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Load a resource spawn configuration.
     */
    private ArenaConfig.ResourceSpawn loadResource(Map<?, ?> map) {
        try {
            String type = (String) map.get("type");
            int interval = getInt(map, "interval_seconds", 10);
            
            Map<?, ?> locationMap = (Map<?, ?>) map.get("location");
            SpawnPoint location = parseSpawnPoint(locationMap);
            
            if (type == null || location == null) {
                return null;
            }
            
            return new ArenaConfig.ResourceSpawn(type, location, interval);
        } catch (Exception e) {
            LOGGER.warning("Failed to parse resource spawn: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Helper to get a double from a map.
     */
    private double getDouble(Map<?, ?> map, String key, double defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return defaultValue;
    }
    
    /**
     * Helper to get an int from a map.
     */
    private int getInt(Map<?, ?> map, String key, int defaultValue) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
    
    /**
     * Register an arena configuration.
     */
    private void registerArena(ArenaConfig config) {
        String arenaId = config.getName().toLowerCase().replace(" ", "_");
        arenas.put(arenaId, config);
        
        arenasByGameType
                .computeIfAbsent(config.getGameType(), k -> new ArrayList<>())
                .add(config);
    }
    
    // ==================== Public API ====================
    
    /**
     * Get an arena configuration by name.
     * 
     * @param name Arena name (case-insensitive, spaces replaced with underscores)
     * @return Arena config, or null if not found
     */
    public ArenaConfig getArena(String name) {
        return arenas.get(name.toLowerCase().replace(" ", "_"));
    }
    
    /**
     * Get all arenas for a game type.
     * 
     * @param gameType Game type to filter by
     * @return List of arena configs for that game type
     */
    public List<ArenaConfig> getArenasForGameType(String gameType) {
        return Collections.unmodifiableList(
                arenasByGameType.getOrDefault(gameType, Collections.emptyList()));
    }
    
    /**
     * Get a random arena for a game type.
     * 
     * @param gameType Game type
     * @return Random arena config, or null if none available
     */
    public ArenaConfig getRandomArena(String gameType) {
        List<ArenaConfig> typeArenas = arenasByGameType.get(gameType);
        if (typeArenas == null || typeArenas.isEmpty()) {
            return null;
        }
        return typeArenas.get(new Random().nextInt(typeArenas.size()));
    }
    
    /**
     * Get the default arena for a game type (first registered).
     */
    public ArenaConfig getDefaultArena(String gameType) {
        List<ArenaConfig> typeArenas = arenasByGameType.get(gameType);
        if (typeArenas == null || typeArenas.isEmpty()) {
            return null;
        }
        return typeArenas.get(0);
    }
    
    /**
     * Get all loaded arena names.
     */
    public Set<String> getArenaNames() {
        return Collections.unmodifiableSet(arenas.keySet());
    }
    
    /**
     * Get all game types that have arenas.
     */
    public Set<String> getGameTypes() {
        return Collections.unmodifiableSet(arenasByGameType.keySet());
    }
    
    /**
     * Get spawn points for a team in an arena.
     * Convenience method that handles null checks.
     * 
     * @param arenaName Arena name
     * @param team Team name (e.g., "blue_team", "red_team")
     * @return List of spawn points, or empty list if not found
     */
    public List<SpawnPoint> getSpawnPoints(String arenaName, String team) {
        ArenaConfig config = getArena(arenaName);
        if (config == null) {
            return Collections.emptyList();
        }
        return config.getSpawns(team);
    }
    
    /**
     * Get the schematic file for an arena.
     * 
     * @param arenaName Arena name
     * @return File object, or null if arena not found or has no schematic
     */
    public File getSchematicFile(String arenaName) {
        ArenaConfig config = getArena(arenaName);
        if (config == null || !config.hasSchematic()) {
            return null;
        }
        
        return new File(plugin.getDataFolder(),
                SCHEMATICS_FOLDER + "/" + config.getSchematicPath());
    }
    
    /**
     * Check if an arena has a schematic file that exists.
     */
    public boolean hasSchematic(String arenaName) {
        File schematic = getSchematicFile(arenaName);
        return schematic != null && schematic.exists();
    }
    
    /**
     * Reload all arena configurations.
     */
    public void reloadArenas() {
        LOGGER.info("Reloading arena configurations...");
        loadArenas();
    }
    
    /**
     * Get total number of loaded arenas.
     */
    public int getArenaCount() {
        return arenas.size();
    }
}
