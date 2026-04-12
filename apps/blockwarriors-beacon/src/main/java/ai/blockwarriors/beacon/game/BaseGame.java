package ai.blockwarriors.beacon.game;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.ArenaManager;
import ai.blockwarriors.beacon.arena.SchematicLoader;

import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;
import java.util.*;
import java.util.logging.Logger;

/**
 * Abstract base class for all game implementations.
 * 
 * Game developers must extend this class to create new game types.
 * The game lifecycle is:
 * 1. Constructor - basic setup
 * 2. initialize() - called once when game is created
 * 3. start() - called to begin gameplay
 * 4. [game events] - handlePlayerDeath(), handleObjective(), etc.
 * 5. checkWinCondition() - checked after events
 * 6. cleanup() - called when game ends
 * 
 * @see GameRegistry for registering game implementations
 */
public abstract class BaseGame {
    
    protected static final Logger LOGGER = Logger.getLogger("beacon");
    
    /** The type of this game (e.g., "pvp", "sky_tiles") */
    protected final String gameType;
    
    /** Unique identifier for this match instance */
    protected final String matchId;
    
    /** Reference to the plugin for scheduling tasks */
    protected final JavaPlugin plugin;
    
    /** The world this game is running in */
    protected World world;
    
    /** Arena configuration (spawns, boundaries, objectives) */
    protected ArenaConfig arenaConfig;

    /** Arena manager for schematic resolution */
    protected ArenaManager arenaManager;
    
    /** Current game state */
    protected GameState state = GameState.INITIALIZING;
    
    /** All players in this game */
    protected final Set<UUID> players = new HashSet<>();
    
    /** Blue team players */
    protected final List<UUID> blueTeam = new ArrayList<>();
    
    /** Red team players */
    protected final List<UUID> redTeam = new ArrayList<>();
    
    /** Players who have disconnected (for grace period tracking) */
    protected final Map<UUID, Long> disconnectedPlayers = new HashMap<>();
    
    /** Time when the game started (for telemetry) */
    protected long startTime;
    
    /** Time when the game ended */
    protected long endTime;
    
    /** Winner player ID (null if no winner yet or draw) */
    protected UUID winnerId;
    
    /**
     * Create a new game instance.
     * 
     * @param plugin The JavaPlugin instance
     * @param gameType The type of game (must match registered type)
     * @param matchId Unique match identifier from backend
     */
    protected BaseGame(JavaPlugin plugin, String gameType, String matchId) {
        this.plugin = plugin;
        this.gameType = gameType;
        this.matchId = matchId;
    }
    
    // ==================== Abstract Lifecycle Methods ====================
    
    /**
     * Initialize the game. Called once after construction.
     * Set up any game-specific state, load resources, etc.
     * 
     * @param world The world the game will run in
     * @param arenaConfig Arena configuration with spawns and boundaries
     * @param blueTeamPlayers Players on the blue team
     * @param redTeamPlayers Players on the red team
     */
    public abstract void initialize(World world, ArenaConfig arenaConfig,
                                   List<Player> blueTeamPlayers, List<Player> redTeamPlayers);
    
    /**
     * Start the game. Called after all players are teleported and ready.
     * Begin countdown, enable PvP, spawn items, etc.
     */
    public abstract void start();
    
    /**
     * Handle a player death event.
     * 
     * @param deadPlayer The player who died
     * @param killer The killer (null if environmental death)
     * @return true if the death was handled, false to let default behavior occur
     */
    public abstract boolean handlePlayerDeath(Player deadPlayer, Player killer);
    
    /**
     * Handle a game-specific objective event.
     * Each game defines what "objectives" mean (e.g., bed destroyed, flag captured).
     * 
     * @param objectiveType Type of objective (game-specific)
     * @param player Player who triggered the objective
     * @param data Additional objective data (game-specific)
     * @return true if objective was handled
     */
    public abstract boolean handleObjective(String objectiveType, Player player, Map<String, Object> data);
    
    /**
     * Check if win conditions have been met.
     * Called after significant events (deaths, objectives).
     * 
     * @return true if game should end
     */
    public abstract boolean checkWinCondition();
    
    /**
     * Get the current game state for telemetry.
     * Returns game-specific data to be sent to the backend.
     * 
     * @return Map of game state data
     */
    public abstract Map<String, Object> getGameState();
    
    /**
     * Clean up the game. Called when game ends.
     * Cancel tasks, clear scoreboards, reset state, etc.
     */
    public abstract void cleanup();
    
    // ==================== Disconnect Handling ====================
    
    /**
     * Handle player disconnect. Game decides outcome based on policy.
     * 
     * @param playerId UUID of disconnected player
     * @param reason Why the player disconnected
     * @return Result indicating how to proceed
     */
    public abstract DisconnectResult handlePlayerDisconnect(UUID playerId, DisconnectReason reason);
    
    /**
     * Handle player reconnect during grace period.
     * 
     * @param playerId UUID of reconnecting player
     * @return true if reconnect was successful
     */
    public abstract boolean handlePlayerReconnect(UUID playerId);
    
    /**
     * Get the disconnect policy for this game type.
     * 
     * @return Disconnect policy configuration
     */
    public abstract DisconnectPolicy getDisconnectPolicy();
    
    // ==================== Common Implementations ====================
    
    /**
     * Get the game type identifier.
     */
    public String getGameType() {
        return gameType;
    }
    
    /**
     * Get the match ID.
     */
    public String getMatchId() {
        return matchId;
    }
    
    /**
     * Get the current game state.
     */
    public GameState getState() {
        return state;
    }
    
    /**
     * Set the game state.
     */
    protected void setState(GameState newState) {
        GameState oldState = this.state;
        this.state = newState;
        LOGGER.info(String.format("Match %s: State changed %s -> %s", matchId, oldState, newState));
    }
    
    /**
     * Get all players in this game.
     */
    public Set<UUID> getPlayers() {
        return Collections.unmodifiableSet(players);
    }
    
    /**
     * Get blue team players.
     */
    public List<UUID> getBlueTeam() {
        return Collections.unmodifiableList(blueTeam);
    }
    
    /**
     * Get red team players.
     */
    public List<UUID> getRedTeam() {
        return Collections.unmodifiableList(redTeam);
    }
    
    /**
     * Get the world this game is running in.
     */
    public World getWorld() {
        return world;
    }
    
    /**
     * Get the arena configuration.
     */
    public ArenaConfig getArenaConfig() {
        return arenaConfig;
    }

    /**
     * Set the arena manager for schematic resolution.
     * Called by MatchInitializer before initialize().
     */
    public void setArenaManager(ArenaManager arenaManager) {
        this.arenaManager = arenaManager;
    }
    
    /**
     * Check if a player is in this game.
     */
    public boolean hasPlayer(UUID playerId) {
        return players.contains(playerId);
    }
    
    /**
     * Get the team for a player.
     * 
     * @return "blue", "red", or null if not in a team
     */
    public String getTeamForPlayer(UUID playerId) {
        if (blueTeam.contains(playerId)) {
            return "blue";
        } else if (redTeam.contains(playerId)) {
            return "red";
        }
        return null;
    }
    
    /**
     * Check if a player is currently disconnected (in grace period).
     */
    public boolean isPlayerDisconnected(UUID playerId) {
        return disconnectedPlayers.containsKey(playerId);
    }
    
    /**
     * Get the winner's UUID.
     * 
     * @return Winner UUID, or null if no winner yet
     */
    public UUID getWinnerId() {
        return winnerId;
    }
    
    /**
     * Get the game duration in milliseconds.
     * Returns 0 if game hasn't started.
     */
    public long getDurationMillis() {
        if (startTime == 0) {
            return 0;
        }
        long end = endTime > 0 ? endTime : System.currentTimeMillis();
        return end - startTime;
    }
    
    /**
     * Check if the game is currently active (can receive events).
     */
    public boolean isActive() {
        return state == GameState.IN_PROGRESS || state == GameState.PAUSED;
    }
    
    /**
     * Check if the game has ended.
     */
    public boolean hasEnded() {
        return state == GameState.FINISHED || state == GameState.TERMINATED;
    }
    
    // ==================== Event Methods ====================

    /**
     * Handle damage dealt by one player to another.
     * Default implementation is a no-op. Override in game implementations
     * that need to track damage (e.g., PvP).
     *
     * @param damager The player dealing damage
     * @param target The player receiving damage
     * @param damage The final damage amount
     */
    public void handleDamage(Player damager, Player target, double damage) {
        // Default no-op — override in subclasses that track damage
    }

    // ==================== Arena Loading ====================

    /**
     * Load the arena for this game. Tries to load a WorldEdit schematic first;
     * if unavailable or no schematic exists, falls back to programmatic generation
     * via {@link #generateArena()}.
     */
    protected void loadArena() {
        try {
            if (arenaConfig != null && arenaManager != null && SchematicLoader.isAvailable()) {
                File schematicFile = arenaManager.getSchematicFile(arenaConfig.getName());
                if (schematicFile != null && schematicFile.exists()) {
                    boolean success = SchematicLoader.pasteSchematic(schematicFile, world, 0, 65, 0);
                    if (success) {
                        LOGGER.info("Arena loaded from schematic for match " + matchId);
                        return;
                    }
                    LOGGER.warning("Schematic paste failed for match " + matchId + ", falling back to programmatic generation");
                }
            }
        } catch (NoClassDefFoundError e) {
            // WorldEdit classes not on classpath — expected when WorldEdit is not installed
            LOGGER.info("WorldEdit not available (classes not found), using programmatic arena generation");
        }
        generateArena();
    }

    /**
     * Generate the arena programmatically. Called as a fallback when no
     * schematic is available. Subclasses should override this to place
     * blocks for their specific arena layout.
     */
    protected void generateArena() {
        // Default no-op — subclasses override with block placement logic
    }

    // ==================== Utility Methods ====================

    /**
     * Get players on the opposing team.
     * 
     * @param playerId Player to find opponents for
     * @return List of opponent UUIDs
     */
    public List<UUID> getOpponents(UUID playerId) {
        if (blueTeam.contains(playerId)) {
            return new ArrayList<>(redTeam);
        } else if (redTeam.contains(playerId)) {
            return new ArrayList<>(blueTeam);
        }
        return new ArrayList<>();
    }
    
    /**
     * Get teammates of a player (excluding the player themselves).
     * 
     * @param playerId Player to find teammates for
     * @return List of teammate UUIDs
     */
    protected List<UUID> getTeammates(UUID playerId) {
        List<UUID> teammates = new ArrayList<>();
        if (blueTeam.contains(playerId)) {
            for (UUID id : blueTeam) {
                if (!id.equals(playerId)) {
                    teammates.add(id);
                }
            }
        } else if (redTeam.contains(playerId)) {
            for (UUID id : redTeam) {
                if (!id.equals(playerId)) {
                    teammates.add(id);
                }
            }
        }
        return teammates;
    }
    
    /**
     * Count active (non-disconnected) players on a team.
     * 
     * @param team "blue" or "red"
     * @return Number of active players
     */
    protected int countActivePlayers(String team) {
        List<UUID> teamPlayers = "blue".equals(team) ? blueTeam : redTeam;
        int count = 0;
        for (UUID playerId : teamPlayers) {
            if (!disconnectedPlayers.containsKey(playerId)) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * End the game with a winner.
     * 
     * @param winner UUID of winning player (null for draw)
     */
    protected void endGame(UUID winner) {
        this.winnerId = winner;
        this.endTime = System.currentTimeMillis();
        setState(GameState.FINISHED);
        LOGGER.info(String.format("Match %s ended. Winner: %s, Duration: %dms",
                matchId, winner != null ? winner.toString() : "none", getDurationMillis()));
    }
    
    /**
     * Terminate the game early (cancelled, error, etc.).
     * 
     * @param reason Reason for termination
     */
    protected void terminateGame(String reason) {
        this.endTime = System.currentTimeMillis();
        setState(GameState.TERMINATED);
        LOGGER.warning(String.format("Match %s terminated: %s", matchId, reason));
    }
    
    @Override
    public String toString() {
        return String.format("BaseGame{type=%s, matchId=%s, state=%s, players=%d}",
                gameType, matchId, state, players.size());
    }
}
