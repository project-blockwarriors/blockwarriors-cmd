package ai.blockwarriors.beacon.game.impl;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.SpawnPoint;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.*;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.*;

/**
 * Reference implementation of a 1v1 PvP game.
 * 
 * Rules:
 * - Two players fight until one dies
 * - First player to kill the other wins
 * - Disconnecting causes immediate forfeit
 * - No respawns - single elimination
 * 
 * This serves as a reference for implementing other game types.
 */
public class PvPGame extends BaseGame {
    
    /** Default disconnect policy: instant forfeit */
    private static final DisconnectPolicy DISCONNECT_POLICY = DisconnectPolicy.instantForfeit();
    
    /** Countdown duration before match starts */
    private static final int COUNTDOWN_SECONDS = 5;
    
    /** Kill counts per player */
    private final Map<UUID, Integer> kills = new HashMap<>();
    
    /** Death counts per player */
    private final Map<UUID, Integer> deaths = new HashMap<>();
    
    /** Damage dealt per player */
    private final Map<UUID, Double> damageDealt = new HashMap<>();
    
    /** Countdown task */
    private BukkitTask countdownTask;
    
    /** Whether PvP is enabled */
    private boolean pvpEnabled = false;
    
    /**
     * Create a new PvP game instance.
     * 
     * @param plugin The JavaPlugin instance
     * @param matchId Unique match identifier
     */
    public PvPGame(JavaPlugin plugin, String matchId) {
        super(plugin, GameConfig.GAME_TYPE_PVP, matchId);
    }
    
    // ==================== Lifecycle Methods ====================
    
    @Override
    public void initialize(World world, ArenaConfig arenaConfig,
                          List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
        this.world = world;
        this.arenaConfig = arenaConfig;
        
        // Register players
        for (Player p : blueTeamPlayers) {
            players.add(p.getUniqueId());
            blueTeam.add(p.getUniqueId());
            initPlayerStats(p.getUniqueId());
        }
        for (Player p : redTeamPlayers) {
            players.add(p.getUniqueId());
            redTeam.add(p.getUniqueId());
            initPlayerStats(p.getUniqueId());
        }
        
        // Teleport players to spawn points
        teleportPlayersToSpawns(blueTeamPlayers, redTeamPlayers);
        
        // Set up players (game mode, inventory, health)
        for (Player p : blueTeamPlayers) {
            setupPlayer(p);
        }
        for (Player p : redTeamPlayers) {
            setupPlayer(p);
        }
        
        setState(GameState.READY);
        LOGGER.info("PvP game initialized for match " + matchId + " with " + 
                   blueTeamPlayers.size() + "v" + redTeamPlayers.size() + " players");
    }
    
    @Override
    public void start() {
        if (state != GameState.READY) {
            LOGGER.warning("Cannot start game - not in READY state (current: " + state + ")");
            return;
        }
        
        setState(GameState.STARTING);
        
        // Start countdown
        startCountdown();
    }
    
    @Override
    public boolean handlePlayerDeath(Player deadPlayer, Player killer) {
        if (!isActive()) {
            return false;
        }
        
        UUID deadId = deadPlayer.getUniqueId();
        
        // Increment death count
        deaths.merge(deadId, 1, Integer::sum);
        
        // If there was a killer, increment their kill count
        if (killer != null) {
            UUID killerId = killer.getUniqueId();
            kills.merge(killerId, 1, Integer::sum);
            
            // Announce kill
            broadcastMessage("§c" + deadPlayer.getName() + " §7was killed by §a" + killer.getName());
            
            // Set winner
            winnerId = killerId;
        } else {
            // Environmental death
            broadcastMessage("§c" + deadPlayer.getName() + " §7died");
            
            // Winner is the opponent
            List<UUID> opponents = getOpponents(deadId);
            if (!opponents.isEmpty()) {
                winnerId = opponents.get(0);
            }
        }
        
        LOGGER.info("Player death in match " + matchId + ": " + deadPlayer.getName() +
                   (killer != null ? " killed by " + killer.getName() : " (environmental)"));
        
        return true;
    }
    
    @Override
    public boolean handleObjective(String objectiveType, Player player, Map<String, Object> data) {
        // PvP doesn't have objectives - deaths are the only win condition
        return false;
    }
    
    @Override
    public boolean checkWinCondition() {
        // Win condition: one team has no living players
        // In 1v1 PvP, this means someone died
        return winnerId != null;
    }
    
    @Override
    public Map<String, Object> getGameState() {
        Map<String, Object> state = new HashMap<>();
        state.put("gameType", gameType);
        state.put("matchId", matchId);
        state.put("state", this.state.name());
        state.put("pvpEnabled", pvpEnabled);
        state.put("durationMs", getDurationMillis());
        
        // Player stats
        List<Map<String, Object>> playerStats = new ArrayList<>();
        for (UUID playerId : players) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("playerId", playerId.toString());
            stats.put("team", getTeamForPlayer(playerId));
            stats.put("kills", kills.getOrDefault(playerId, 0));
            stats.put("deaths", deaths.getOrDefault(playerId, 0));
            stats.put("damageDealt", damageDealt.getOrDefault(playerId, 0.0));
            stats.put("disconnected", isPlayerDisconnected(playerId));
            
            // Online player info
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                stats.put("health", player.getHealth());
                stats.put("hunger", player.getFoodLevel());
            }
            
            playerStats.add(stats);
        }
        state.put("players", playerStats);
        
        // Winner info
        if (winnerId != null) {
            state.put("winnerId", winnerId.toString());
        }
        
        return state;
    }
    
    @Override
    public void cleanup() {
        // Cancel countdown if running
        if (countdownTask != null && !countdownTask.isCancelled()) {
            countdownTask.cancel();
        }
        
        pvpEnabled = false;
        
        // Reset players (optional - they'll be teleported away anyway)
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                // Clear any status effects
                for (PotionEffect effect : player.getActivePotionEffects()) {
                    player.removePotionEffect(effect.getType());
                }
            }
        }
        
        LOGGER.info("PvP game cleanup completed for match " + matchId);
    }
    
    // ==================== Disconnect Handling ====================
    
    @Override
    public DisconnectResult handlePlayerDisconnect(UUID playerId, DisconnectReason reason) {
        if (!hasPlayer(playerId)) {
            return null;
        }
        
        LOGGER.info("Player " + playerId + " disconnected from PvP match " + matchId + " (reason: " + reason + ")");
        
        // PvP uses instant forfeit - other team wins immediately
        List<UUID> opponents = getOpponents(playerId);
        if (!opponents.isEmpty()) {
            winnerId = opponents.get(0);
            
            // Announce forfeit
            broadcastMessage("§c" + getPlayerName(playerId) + " §7disconnected. §aOpponent wins!");
        }
        
        // Mark as disconnected
        disconnectedPlayers.put(playerId, System.currentTimeMillis());
        
        return DisconnectResult.FORFEIT;
    }
    
    @Override
    public boolean handlePlayerReconnect(UUID playerId) {
        // PvP uses instant forfeit, so reconnect is not allowed
        return false;
    }
    
    @Override
    public DisconnectPolicy getDisconnectPolicy() {
        return DISCONNECT_POLICY;
    }
    
    // ==================== Private Helper Methods ====================
    
    private void initPlayerStats(UUID playerId) {
        kills.put(playerId, 0);
        deaths.put(playerId, 0);
        damageDealt.put(playerId, 0.0);
    }
    
    private void teleportPlayersToSpawns(List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
        // Get spawn points from arena config, or use defaults
        List<SpawnPoint> blueSpawns = null;
        List<SpawnPoint> redSpawns = null;
        
        if (arenaConfig != null) {
            blueSpawns = arenaConfig.getSpawns("blue_team");
            redSpawns = arenaConfig.getSpawns("red_team");
        }
        
        // Teleport blue team
        for (int i = 0; i < blueTeamPlayers.size(); i++) {
            Player player = blueTeamPlayers.get(i);
            Location spawnLoc;
            
            if (blueSpawns != null && i < blueSpawns.size()) {
                spawnLoc = blueSpawns.get(i).toLocation(world);
            } else {
                // Default spawn
                spawnLoc = new Location(world, 10, 65, 0, -90, 0);
            }
            
            player.teleport(spawnLoc);
        }
        
        // Teleport red team
        for (int i = 0; i < redTeamPlayers.size(); i++) {
            Player player = redTeamPlayers.get(i);
            Location spawnLoc;
            
            if (redSpawns != null && i < redSpawns.size()) {
                spawnLoc = redSpawns.get(i).toLocation(world);
            } else {
                // Default spawn
                spawnLoc = new Location(world, -10, 65, 0, 90, 0);
            }
            
            player.teleport(spawnLoc);
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
        
        // Give initial freeze effect during countdown
        player.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 
                (COUNTDOWN_SECONDS + 1) * 20, 255, false, false));
        player.addPotionEffect(new PotionEffect(PotionEffectType.JUMP_BOOST, 
                (COUNTDOWN_SECONDS + 1) * 20, 128, false, false)); // Prevents jumping
    }
    
    private void startCountdown() {
        countdownTask = new BukkitRunnable() {
            int countdown = COUNTDOWN_SECONDS;
            
            @Override
            public void run() {
                if (countdown > 0) {
                    broadcastTitle("§e" + countdown, "§7Get ready to fight!");
                    playSound(Sound.BLOCK_NOTE_BLOCK_PLING, 1.0f);
                    countdown--;
                } else {
                    // Start the fight!
                    startTime = System.currentTimeMillis();
                    pvpEnabled = true;
                    setState(GameState.IN_PROGRESS);
                    
                    broadcastTitle("§a§lFIGHT!", "");
                    playSound(Sound.ENTITY_ENDER_DRAGON_GROWL, 1.0f);
                    
                    // Remove freeze effects
                    for (UUID playerId : players) {
                        Player player = Bukkit.getPlayer(playerId);
                        if (player != null && player.isOnline()) {
                            player.removePotionEffect(PotionEffectType.SLOWNESS);
                            player.removePotionEffect(PotionEffectType.JUMP_BOOST);
                        }
                    }
                    
                    LOGGER.info("PvP match " + matchId + " started!");
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }
    
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
     * Check if PvP is currently enabled for this match.
     */
    public boolean isPvPEnabled() {
        return pvpEnabled;
    }
    
    /**
     * Record damage dealt by a player.
     * Call this from damage event listeners.
     */
    public void recordDamage(UUID attackerId, double damage) {
        damageDealt.merge(attackerId, damage, Double::sum);
    }
    
    /**
     * Get kill count for a player.
     */
    public int getKills(UUID playerId) {
        return kills.getOrDefault(playerId, 0);
    }
    
    /**
     * Get death count for a player.
     */
    public int getDeaths(UUID playerId) {
        return deaths.getOrDefault(playerId, 0);
    }
}
