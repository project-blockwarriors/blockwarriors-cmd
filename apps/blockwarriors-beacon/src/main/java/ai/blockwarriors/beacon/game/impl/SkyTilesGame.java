package ai.blockwarriors.beacon.game.impl;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.SkyTilesArenaBuilder;
import ai.blockwarriors.beacon.arena.SpawnPoint;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.*;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.*;

/**
 * Sky Tiles - A cooperative tile-based traversal game.
 * 
 * Game Rules:
 * - Two players (from same team) work together to cross a tile grid
 * - Tiles disappear after being stepped on
 * - Players must coordinate to reach the finish platform
 * - Both players must reach the goal to win
 * - Falling into the void results in respawn at last checkpoint
 * - Limited lives per team (shared pool)
 * - If all lives are lost, the game ends
 * 
 * Objectives:
 * - "checkpoint_reached" - Player reached a checkpoint
 * - "goal_reached" - Player reached the final goal
 * - "tile_stepped" - Player stepped on a tile (for tracking/animation)
 * 
 * Win Condition:
 * - Both players reach the goal platform
 * 
 * Disconnect Policy:
 * - 30 second grace period for reconnection
 * - If disconnected player doesn't return, remaining player can attempt solo
 */
public class SkyTilesGame extends BaseGame {
    
    // ==================== Constants ====================
    
    /** Disconnect policy: 30 second grace period */
    private static final DisconnectPolicy DISCONNECT_POLICY = DisconnectPolicy.withGracePeriod(30);
    
    /** Countdown duration before game starts */
    private static final int COUNTDOWN_SECONDS = 5;
    
    /** Default lives per team */
    private static final int DEFAULT_TEAM_LIVES = 5;
    
    /** Delay before tile disappears (in ticks) */
    private static final int TILE_DISAPPEAR_DELAY = 20; // 1 second
    
    // ==================== Game State ====================
    
    /** Remaining lives for the team */
    private int teamLives = DEFAULT_TEAM_LIVES;
    
    /** Players who have reached the goal */
    private final Set<UUID> playersAtGoal = new HashSet<>();
    
    /** Checkpoints reached by each player (for respawn) */
    private final Map<UUID, Location> playerCheckpoints = new HashMap<>();
    
    /** Tiles that have been stepped on (position -> timestamp) */
    private final Map<String, Long> steppedTiles = new HashMap<>();
    
    /** Death count per player */
    private final Map<UUID, Integer> deaths = new HashMap<>();
    
    /** Countdown task */
    private BukkitTask countdownTask;
    
    /** Tile monitoring task */
    private BukkitTask tileMonitorTask;
    
    /** Whether the game is actively running */
    private boolean gameActive = false;
    
    // ==================== Arena Configuration ====================
    
    /** Goal location (from arena config) */
    private Location goalLocation;
    
    /** Checkpoint locations (from arena config) */
    private List<Location> checkpointLocations = new ArrayList<>();
    
    /** Void level (y-coordinate below which player dies) */
    private int voidLevel = 0;
    
    // ==================== Constructor ====================
    
    /**
     * Create a new Sky Tiles game instance.
     * 
     * @param plugin The JavaPlugin instance
     * @param matchId Unique match identifier
     */
    public SkyTilesGame(JavaPlugin plugin, String matchId) {
        super(plugin, GameConfig.GAME_TYPE_SKY_TILES, matchId);
    }
    
    // ==================== Lifecycle Methods ====================
    
    @Override
    public void initialize(World world, ArenaConfig arenaConfig,
                          List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
        this.world = world;
        this.arenaConfig = arenaConfig;
        
        // Sky Tiles is cooperative - both players on same team (blue)
        // For compatibility, we treat all players as blue team
        List<Player> allPlayers = new ArrayList<>();
        allPlayers.addAll(blueTeamPlayers);
        allPlayers.addAll(redTeamPlayers);
        
        // Register all players to blue team (cooperative)
        for (Player p : allPlayers) {
            players.add(p.getUniqueId());
            blueTeam.add(p.getUniqueId());
            deaths.put(p.getUniqueId(), 0);
        }
        
        // Build arena programmatically if no schematic exists or the schematic file is missing
        boolean shouldBuildArena = shouldBuildArenaProgrammatically();
        
        if (shouldBuildArena) {
            LOGGER.info("No schematic found - building Sky Tiles arena programmatically");
            buildArena();
        } else {
            // Load arena-specific configuration from YAML
            loadArenaConfiguration();
        }
        
        // Teleport players to spawn points
        teleportPlayersToSpawns(allPlayers);
        
        // Set up players (game mode, inventory, etc.)
        for (Player p : allPlayers) {
            setupPlayer(p);
        }
        
        setState(GameState.READY);
        LOGGER.info("Sky Tiles game initialized for match " + matchId + " with " + 
                   allPlayers.size() + " players");
    }
    
    /**
     * Check if we should build the arena programmatically.
     * Returns true if:
     * - No arena config is provided
     * - Arena config has no schematic path
     * - Schematic file doesn't actually exist
     */
    private boolean shouldBuildArenaProgrammatically() {
        if (arenaConfig == null) {
            LOGGER.info("No arena config provided");
            return true;
        }
        
        if (!arenaConfig.hasSchematic()) {
            LOGGER.info("Arena config has no schematic path");
            return true;
        }
        
        // Check if the schematic file actually exists
        String schematicPath = arenaConfig.getSchematicPath();
        java.io.File schematicFile = new java.io.File(plugin.getDataFolder(), "schematics/" + schematicPath);
        
        if (!schematicFile.exists()) {
            LOGGER.info("Schematic file not found: " + schematicFile.getAbsolutePath());
            return true;
        }
        
        LOGGER.info("Using schematic: " + schematicPath);
        return false;
    }
    
    /**
     * Build the arena programmatically using SkyTilesArenaBuilder.
     * This is used when no schematic file exists.
     */
    private void buildArena() {
        SkyTilesArenaBuilder builder = new SkyTilesArenaBuilder();
        
        // Build at world origin (or a suitable location)
        int originX = 0;
        int originZ = 0;
        
        // Build the arena and get the result
        SkyTilesArenaBuilder.BuildResult result = builder.build(world, originX, originZ);
        
        // Use the build result to set up game state
        this.goalLocation = result.goal;
        this.checkpointLocations = new ArrayList<>(result.checkpoints);
        this.voidLevel = result.voidLevel;
        
        // Create an ArenaConfig from build result for spawn points
        this.arenaConfig = builder.createConfig(result, world);
        
        LOGGER.info("Arena built - Goal at " + goalLocation + ", " + 
                   checkpointLocations.size() + " checkpoints, void level " + voidLevel);
    }
    
    @Override
    public void start() {
        if (state != GameState.READY) {
            LOGGER.warning("Cannot start game - not in READY state (current: " + state + ")");
            return;
        }
        
        setState(GameState.COUNTDOWN);
        startCountdown();
    }
    
    @Override
    public boolean handlePlayerDeath(Player deadPlayer, Player killer) {
        if (!isActive()) {
            return false;
        }
        
        UUID playerId = deadPlayer.getUniqueId();
        
        // Increment death count
        deaths.merge(playerId, 1, Integer::sum);
        
        // Decrease team lives
        teamLives--;
        
        // Broadcast death
        broadcastMessage("§c" + deadPlayer.getName() + " §7fell! §e" + teamLives + " lives remaining");
        playSound(Sound.ENTITY_PLAYER_HURT, 1.0f);
        
        LOGGER.info("Player " + deadPlayer.getName() + " died in Sky Tiles match " + matchId +
                   ". Team lives: " + teamLives);
        
        // Check if game over
        if (teamLives <= 0) {
            broadcastMessage("§c§lGAME OVER! §7No lives remaining.");
            // No winner - team failed
            winnerId = null;
            return true;
        }
        
        // Respawn player at last checkpoint (on next tick)
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            respawnPlayer(deadPlayer);
        }, 1L);
        
        return true;
    }
    
    @Override
    public boolean handleObjective(String objectiveType, Player player, Map<String, Object> data) {
        if (!isActive()) {
            return false;
        }
        
        UUID playerId = player.getUniqueId();
        
        switch (objectiveType) {
            case "checkpoint_reached":
                return handleCheckpointReached(player, data);
                
            case "goal_reached":
                return handleGoalReached(player);
                
            case "tile_stepped":
                return handleTileStepped(player, data);
                
            default:
                LOGGER.warning("Unknown objective type: " + objectiveType);
                return false;
        }
    }
    
    @Override
    public boolean checkWinCondition() {
        // Win: All players reached the goal
        if (playersAtGoal.containsAll(players)) {
            // All players at goal - team wins
            // In cooperative mode, winning team is "blue"
            winnerId = blueTeam.isEmpty() ? null : blueTeam.get(0);
            return true;
        }
        
        // Loss: No lives remaining
        if (teamLives <= 0) {
            winnerId = null; // No winner - team failed
            return true;
        }
        
        return false;
    }
    
    @Override
    public Map<String, Object> getGameState() {
        Map<String, Object> state = new HashMap<>();
        state.put("gameType", gameType);
        state.put("matchId", matchId);
        state.put("state", this.state.name());
        state.put("gameActive", gameActive);
        state.put("durationMs", getDurationMillis());
        
        // Team stats
        state.put("teamLives", teamLives);
        state.put("maxLives", DEFAULT_TEAM_LIVES);
        state.put("playersAtGoal", playersAtGoal.size());
        state.put("totalPlayers", players.size());
        
        // Player stats
        List<Map<String, Object>> playerStats = new ArrayList<>();
        for (UUID playerId : players) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("playerId", playerId.toString());
            stats.put("team", getTeamForPlayer(playerId));
            stats.put("deaths", deaths.getOrDefault(playerId, 0));
            stats.put("atGoal", playersAtGoal.contains(playerId));
            stats.put("disconnected", isPlayerDisconnected(playerId));
            
            Location checkpoint = playerCheckpoints.get(playerId);
            if (checkpoint != null) {
                Map<String, Object> checkpointData = new HashMap<>();
                checkpointData.put("x", checkpoint.getBlockX());
                checkpointData.put("y", checkpoint.getBlockY());
                checkpointData.put("z", checkpoint.getBlockZ());
                stats.put("lastCheckpoint", checkpointData);
            }
            
            // Online player info
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                stats.put("health", player.getHealth());
                Map<String, Object> pos = new HashMap<>();
                pos.put("x", player.getLocation().getBlockX());
                pos.put("y", player.getLocation().getBlockY());
                pos.put("z", player.getLocation().getBlockZ());
                stats.put("position", pos);
            }
            
            playerStats.add(stats);
        }
        state.put("players", playerStats);
        
        // Tiles stepped
        state.put("tilesSteppedCount", steppedTiles.size());
        
        // Winner info
        if (winnerId != null) {
            state.put("winnerId", winnerId.toString());
        }
        
        return state;
    }
    
    @Override
    public void cleanup() {
        // Cancel tasks
        if (countdownTask != null && !countdownTask.isCancelled()) {
            countdownTask.cancel();
        }
        if (tileMonitorTask != null && !tileMonitorTask.isCancelled()) {
            tileMonitorTask.cancel();
        }
        
        gameActive = false;
        
        // Reset players
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                // Clear any status effects
                for (PotionEffect effect : player.getActivePotionEffects()) {
                    player.removePotionEffect(effect.getType());
                }
            }
        }
        
        LOGGER.info("Sky Tiles game cleanup completed for match " + matchId);
    }
    
    // ==================== Disconnect Handling ====================
    
    @Override
    public DisconnectResult handlePlayerDisconnect(UUID playerId, DisconnectReason reason) {
        if (!hasPlayer(playerId)) {
            return null;
        }
        
        LOGGER.info("Player " + playerId + " disconnected from Sky Tiles match " + matchId + 
                   " (reason: " + reason + ")");
        
        // Mark as disconnected
        disconnectedPlayers.put(playerId, System.currentTimeMillis());
        
        // Broadcast to remaining players
        String playerName = getPlayerName(playerId);
        broadcastMessage("§e" + playerName + " §7disconnected. Waiting for reconnect...");
        
        // Use grace period - other player(s) can continue
        return DisconnectResult.GRACE_PERIOD;
    }
    
    @Override
    public boolean handlePlayerReconnect(UUID playerId) {
        if (!hasPlayer(playerId) || !isPlayerDisconnected(playerId)) {
            return false;
        }
        
        // Remove from disconnected
        disconnectedPlayers.remove(playerId);
        
        // Get player and respawn at checkpoint
        Player player = Bukkit.getPlayer(playerId);
        if (player != null && player.isOnline()) {
            respawnPlayer(player);
            broadcastMessage("§a" + player.getName() + " §7reconnected!");
            LOGGER.info("Player " + playerId + " reconnected to Sky Tiles match " + matchId);
            return true;
        }
        
        return false;
    }
    
    @Override
    public DisconnectPolicy getDisconnectPolicy() {
        return DISCONNECT_POLICY;
    }
    
    // ==================== Objective Handlers ====================
    
    private boolean handleCheckpointReached(Player player, Map<String, Object> data) {
        UUID playerId = player.getUniqueId();
        
        // Get checkpoint location from data
        Location checkpointLoc = null;
        if (data != null && data.containsKey("location")) {
            checkpointLoc = (Location) data.get("location");
        } else {
            checkpointLoc = player.getLocation().clone();
        }
        
        playerCheckpoints.put(playerId, checkpointLoc);
        
        player.sendMessage("§a✓ §7Checkpoint reached!");
        player.playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.2f);
        
        LOGGER.info("Player " + player.getName() + " reached checkpoint in match " + matchId);
        return true;
    }
    
    private boolean handleGoalReached(Player player) {
        UUID playerId = player.getUniqueId();
        
        if (playersAtGoal.contains(playerId)) {
            return false; // Already at goal
        }
        
        playersAtGoal.add(playerId);
        
        broadcastMessage("§a§l★ §e" + player.getName() + " §7reached the goal!");
        playSound(Sound.UI_TOAST_CHALLENGE_COMPLETE, 1.0f);
        
        // Check if all players at goal
        if (playersAtGoal.containsAll(players)) {
            broadcastMessage("§a§l✓ ALL PLAYERS AT GOAL! §7You win!");
        } else {
            int remaining = players.size() - playersAtGoal.size();
            broadcastMessage("§7Waiting for §e" + remaining + " §7more player(s)...");
        }
        
        LOGGER.info("Player " + player.getName() + " reached goal in match " + matchId +
                   ". Players at goal: " + playersAtGoal.size() + "/" + players.size());
        return true;
    }
    
    private boolean handleTileStepped(Player player, Map<String, Object> data) {
        if (data == null || !data.containsKey("block")) {
            return false;
        }
        
        Block block = (Block) data.get("block");
        String blockKey = block.getX() + "," + block.getY() + "," + block.getZ();
        
        // Already stepped on
        if (steppedTiles.containsKey(blockKey)) {
            return false;
        }
        
        // Record tile and schedule disappearance
        steppedTiles.put(blockKey, System.currentTimeMillis());
        
        // Schedule tile to disappear
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            if (gameActive && block.getType() != Material.AIR) {
                block.setType(Material.AIR);
                player.playSound(block.getLocation(), Sound.BLOCK_SAND_BREAK, 0.5f, 0.8f);
            }
        }, TILE_DISAPPEAR_DELAY);
        
        return true;
    }
    
    // ==================== Private Helper Methods ====================
    
    private void loadArenaConfiguration() {
        if (arenaConfig == null) {
            LOGGER.warning("No arena config provided for Sky Tiles, using defaults");
            voidLevel = 0;
            return;
        }
        
        // Load void level from boundaries
        if (arenaConfig.getBoundaries() != null) {
            voidLevel = (int) arenaConfig.getBoundaries().getMinY() - 5; // 5 blocks below min boundary
        }
        
        // Load goal location from objectives
        Map<String, Object> objectives = arenaConfig.getObjectives();
        if (objectives != null && objectives.containsKey("goal")) {
            Object goalObj = objectives.get("goal");
            if (goalObj instanceof int[]) {
                int[] goal = (int[]) goalObj;
                goalLocation = new Location(world, goal[0], goal[1], goal[2]);
            } else if (goalObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Integer> goal = (List<Integer>) goalObj;
                if (goal.size() >= 3) {
                    goalLocation = new Location(world, goal.get(0), goal.get(1), goal.get(2));
                }
            }
        }
        
        // Load checkpoints from objectives
        if (objectives != null) {
            for (String key : objectives.keySet()) {
                if (key.startsWith("checkpoint")) {
                    Object checkpointObj = objectives.get(key);
                    if (checkpointObj instanceof int[]) {
                        int[] checkpoint = (int[]) checkpointObj;
                        checkpointLocations.add(new Location(world, checkpoint[0], checkpoint[1], checkpoint[2]));
                    } else if (checkpointObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<Integer> checkpoint = (List<Integer>) checkpointObj;
                        if (checkpoint.size() >= 3) {
                            checkpointLocations.add(new Location(world, checkpoint.get(0), checkpoint.get(1), checkpoint.get(2)));
                        }
                    }
                }
            }
        }
    }
    
    private void teleportPlayersToSpawns(List<Player> allPlayers) {
        List<SpawnPoint> spawns = null;
        
        if (arenaConfig != null) {
            spawns = arenaConfig.getSpawns("blue_team");
        }
        
        for (int i = 0; i < allPlayers.size(); i++) {
            Player player = allPlayers.get(i);
            Location spawnLoc;
            
            if (spawns != null && i < spawns.size()) {
                spawnLoc = spawns.get(i).toLocation(world);
            } else {
                // Default spawn
                spawnLoc = new Location(world, i * 3, 65, 0);
            }
            
            player.teleport(spawnLoc);
            playerCheckpoints.put(player.getUniqueId(), spawnLoc.clone());
        }
    }
    
    private void setupPlayer(Player player) {
        // Set game mode
        player.setGameMode(GameMode.SURVIVAL);
        
        // Clear inventory
        player.getInventory().clear();
        
        // Reset health and hunger
        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.setSaturation(20.0f);
        
        // Clear potion effects
        for (PotionEffect effect : player.getActivePotionEffects()) {
            player.removePotionEffect(effect.getType());
        }
        
        // Freeze during countdown
        player.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 
                (COUNTDOWN_SECONDS + 1) * 20, 255, false, false));
        player.addPotionEffect(new PotionEffect(PotionEffectType.JUMP_BOOST, 
                (COUNTDOWN_SECONDS + 1) * 20, 128, false, false));
    }
    
    private void respawnPlayer(Player player) {
        if (!player.isOnline()) {
            return;
        }
        
        Location checkpoint = playerCheckpoints.get(player.getUniqueId());
        if (checkpoint == null) {
            // Use spawn from arena config
            List<SpawnPoint> spawns = arenaConfig != null ? arenaConfig.getSpawns("blue_team") : null;
            if (spawns != null && !spawns.isEmpty()) {
                checkpoint = spawns.get(0).toLocation(world);
            } else {
                checkpoint = new Location(world, 0, 65, 0);
            }
        }
        
        player.teleport(checkpoint);
        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.sendMessage("§7Respawned at last checkpoint");
    }
    
    private void startCountdown() {
        countdownTask = new BukkitRunnable() {
            int countdown = COUNTDOWN_SECONDS;
            
            @Override
            public void run() {
                if (countdown > 0) {
                    broadcastTitle("§e" + countdown, "§7Work together to reach the goal!");
                    playSound(Sound.BLOCK_NOTE_BLOCK_PLING, 1.0f);
                    countdown--;
                } else {
                    // Start the game
                    startTime = System.currentTimeMillis();
                    gameActive = true;
                    setState(GameState.IN_PROGRESS);
                    
                    broadcastTitle("§a§lGO!", "§7Cross the tiles carefully!");
                    playSound(Sound.ENTITY_PLAYER_LEVELUP, 1.0f);
                    
                    // Remove freeze effects
                    for (UUID playerId : players) {
                        Player player = Bukkit.getPlayer(playerId);
                        if (player != null && player.isOnline()) {
                            player.removePotionEffect(PotionEffectType.SLOWNESS);
                            player.removePotionEffect(PotionEffectType.JUMP_BOOST);
                        }
                    }
                    
                    // Start tile monitoring
                    startTileMonitor();
                    
                    LOGGER.info("Sky Tiles match " + matchId + " started!");
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }
    
    private void startTileMonitor() {
        // Monitor player positions for void deaths
        tileMonitorTask = new BukkitRunnable() {
            @Override
            public void run() {
                if (!gameActive) {
                    cancel();
                    return;
                }
                
                for (UUID playerId : players) {
                    if (isPlayerDisconnected(playerId) || playersAtGoal.contains(playerId)) {
                        continue;
                    }
                    
                    Player player = Bukkit.getPlayer(playerId);
                    if (player == null || !player.isOnline()) {
                        continue;
                    }
                    
                    // Check for void death
                    if (player.getLocation().getY() < voidLevel) {
                        // Trigger death
                        handlePlayerDeath(player, null);
                    }
                    
                    // Check for goal reached (if goal is defined)
                    if (goalLocation != null && !playersAtGoal.contains(playerId)) {
                        double distance = player.getLocation().distance(goalLocation);
                        if (distance < 2.0) {
                            handleGoalReached(player);
                        }
                    }
                }
            }
        }.runTaskTimer(plugin, 10L, 10L); // Every half second
    }
    
    // ==================== Broadcast Helpers ====================
    
    private void broadcastMessage(String message) {
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                player.sendMessage(message);
            }
        }
    }
    
    private void broadcastTitle(String title, String subtitle) {
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                player.sendTitle(title, subtitle, 5, 20, 5);
            }
        }
    }
    
    private void playSound(Sound sound, float pitch) {
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                player.playSound(player.getLocation(), sound, 1.0f, pitch);
            }
        }
    }
    
    private String getPlayerName(UUID playerId) {
        Player player = Bukkit.getPlayer(playerId);
        return player != null ? player.getName() : playerId.toString().substring(0, 8);
    }
    
    // ==================== Public Methods ====================
    
    /**
     * Check if the game is actively running.
     */
    public boolean isGameActive() {
        return gameActive;
    }
    
    /**
     * Get remaining team lives.
     */
    public int getTeamLives() {
        return teamLives;
    }
    
    /**
     * Get death count for a player.
     */
    public int getDeaths(UUID playerId) {
        return deaths.getOrDefault(playerId, 0);
    }
    
    /**
     * Check if a player has reached the goal.
     */
    public boolean hasReachedGoal(UUID playerId) {
        return playersAtGoal.contains(playerId);
    }
}
