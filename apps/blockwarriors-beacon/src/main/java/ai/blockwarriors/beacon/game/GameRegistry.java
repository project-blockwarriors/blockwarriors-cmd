package ai.blockwarriors.beacon.game;

import org.bukkit.plugin.java.JavaPlugin;

import java.util.*;
import java.util.logging.Logger;

/**
 * Singleton registry for game type implementations.
 * 
 * Maps game type strings (e.g., "pvp", "sky_tiles") to GameFactory instances
 * that can create game objects. Games are registered at plugin startup and
 * instantiated by MatchPollingService when matches are ready to start.
 * 
 * Usage:
 * <pre>
 * // Register a game type (typically in Plugin.onEnable())
 * GameRegistry.getInstance().registerGame("pvp", PvPGame::new);
 * 
 * // Create a game instance
 * BaseGame game = GameRegistry.getInstance().createGame("pvp", plugin, matchId);
 * </pre>
 */
public class GameRegistry {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    /** Singleton instance */
    private static GameRegistry instance;
    
    /** Map of game type to factory */
    private final Map<String, GameFactory> factories = new HashMap<>();
    
    /** Map of game type to metadata */
    private final Map<String, GameMetadata> metadata = new HashMap<>();
    
    /** Private constructor for singleton */
    private GameRegistry() {
        LOGGER.info("GameRegistry initialized");
    }
    
    /**
     * Get the singleton GameRegistry instance.
     * Creates the instance if it doesn't exist.
     */
    public static synchronized GameRegistry getInstance() {
        if (instance == null) {
            instance = new GameRegistry();
        }
        return instance;
    }
    
    /**
     * Register a game type with its factory.
     * 
     * @param gameType Unique game type identifier (e.g., "pvp", "sky_tiles")
     * @param factory Factory function to create game instances
     * @throws IllegalArgumentException if gameType is null or empty
     * @throws IllegalStateException if gameType is already registered
     */
    public void registerGame(String gameType, GameFactory factory) {
        registerGame(gameType, factory, null);
    }
    
    /**
     * Register a game type with its factory and metadata.
     * 
     * @param gameType Unique game type identifier
     * @param factory Factory function to create game instances
     * @param meta Optional metadata about the game type
     */
    public void registerGame(String gameType, GameFactory factory, GameMetadata meta) {
        if (gameType == null || gameType.isEmpty()) {
            throw new IllegalArgumentException("gameType cannot be null or empty");
        }
        if (factory == null) {
            throw new IllegalArgumentException("factory cannot be null");
        }
        if (factories.containsKey(gameType)) {
            throw new IllegalStateException("Game type '" + gameType + "' is already registered");
        }
        
        factories.put(gameType, factory);
        if (meta != null) {
            metadata.put(gameType, meta);
        }
        
        LOGGER.info("Registered game type: " + gameType);
    }
    
    /**
     * Unregister a game type.
     * Typically used during plugin disable or for testing.
     * 
     * @param gameType Game type to unregister
     * @return true if game type was registered and removed
     */
    public boolean unregisterGame(String gameType) {
        GameFactory removed = factories.remove(gameType);
        metadata.remove(gameType);
        if (removed != null) {
            LOGGER.info("Unregistered game type: " + gameType);
            return true;
        }
        return false;
    }
    
    /**
     * Create a new game instance for the specified type.
     * 
     * @param gameType Type of game to create
     * @param plugin JavaPlugin instance for scheduling
     * @param matchId Unique match identifier
     * @return New BaseGame instance, or null if game type not found
     */
    public BaseGame createGame(String gameType, JavaPlugin plugin, String matchId) {
        GameFactory factory = factories.get(gameType);
        if (factory == null) {
            LOGGER.warning("No factory registered for game type: " + gameType);
            return null;
        }
        
        try {
            BaseGame game = factory.createGame(plugin, matchId);
            LOGGER.info("Created game instance: " + gameType + " for match " + matchId);
            return game;
        } catch (Exception e) {
            LOGGER.severe("Failed to create game " + gameType + ": " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Check if a game type is registered.
     */
    public boolean isRegistered(String gameType) {
        return factories.containsKey(gameType);
    }
    
    /**
     * Get all registered game types.
     */
    public Set<String> getRegisteredTypes() {
        return Collections.unmodifiableSet(factories.keySet());
    }
    
    /**
     * Get metadata for a game type.
     * 
     * @param gameType Game type to look up
     * @return Metadata, or null if not available
     */
    public GameMetadata getMetadata(String gameType) {
        return metadata.get(gameType);
    }
    
    /**
     * Get the number of registered game types.
     */
    public int getRegisteredCount() {
        return factories.size();
    }
    
    /**
     * Clear all registered games.
     * Typically used during plugin disable or for testing.
     */
    public void clearAll() {
        int count = factories.size();
        factories.clear();
        metadata.clear();
        LOGGER.info("Cleared " + count + " registered game types");
    }
    
    /**
     * Reset the singleton instance.
     * Used for testing purposes only.
     */
    public static synchronized void resetInstance() {
        if (instance != null) {
            instance.clearAll();
            instance = null;
        }
    }
    
    /**
     * Metadata about a game type.
     * Optional information that can be used for UI display, validation, etc.
     */
    public static class GameMetadata {
        private final String displayName;
        private final String description;
        private final int playersPerTeam;
        private final int teamCount;
        private final String defaultArena;
        
        public GameMetadata(String displayName, String description,
                           int playersPerTeam, int teamCount, String defaultArena) {
            this.displayName = displayName;
            this.description = description;
            this.playersPerTeam = playersPerTeam;
            this.teamCount = teamCount;
            this.defaultArena = defaultArena;
        }
        
        public static Builder builder() {
            return new Builder();
        }
        
        public String getDisplayName() {
            return displayName;
        }
        
        public String getDescription() {
            return description;
        }
        
        public int getPlayersPerTeam() {
            return playersPerTeam;
        }
        
        public int getTeamCount() {
            return teamCount;
        }
        
        public int getTotalPlayers() {
            return playersPerTeam * teamCount;
        }
        
        public String getDefaultArena() {
            return defaultArena;
        }
        
        public static class Builder {
            private String displayName;
            private String description;
            private int playersPerTeam = 1;
            private int teamCount = 2;
            private String defaultArena;
            
            public Builder displayName(String name) {
                this.displayName = name;
                return this;
            }
            
            public Builder description(String desc) {
                this.description = desc;
                return this;
            }
            
            public Builder playersPerTeam(int count) {
                this.playersPerTeam = count;
                return this;
            }
            
            public Builder teamCount(int count) {
                this.teamCount = count;
                return this;
            }
            
            public Builder defaultArena(String arena) {
                this.defaultArena = arena;
                return this;
            }
            
            public GameMetadata build() {
                return new GameMetadata(displayName, description,
                        playersPerTeam, teamCount, defaultArena);
            }
        }
    }
}
