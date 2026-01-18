package ai.blockwarriors.beacon.game;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.logging.Logger;

/**
 * Tracks grace periods for disconnected players and handles timeouts.
 * 
 * When a player disconnects with a grace period policy, this tracker:
 * 1. Records the disconnect time
 * 2. Schedules a timeout task
 * 3. Calls the timeout handler when grace period expires
 * 4. Handles reconnection by canceling the timeout
 */
public class GracePeriodTracker {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    /**
     * Information about a disconnected player in grace period.
     */
    public static class DisconnectInfo {
        public final UUID playerId;
        public final String matchId;
        public final long disconnectTime;
        public final long gracePeriodEnds;
        public final DisconnectReason reason;
        public final BukkitTask timeoutTask;
        
        public DisconnectInfo(UUID playerId, String matchId, long disconnectTime,
                            int gracePeriodSeconds, DisconnectReason reason, BukkitTask timeoutTask) {
            this.playerId = playerId;
            this.matchId = matchId;
            this.disconnectTime = disconnectTime;
            this.gracePeriodEnds = disconnectTime + (gracePeriodSeconds * 1000L);
            this.reason = reason;
            this.timeoutTask = timeoutTask;
        }
        
        /**
         * Get remaining grace period time in milliseconds.
         */
        public long getRemainingMs() {
            return Math.max(0, gracePeriodEnds - System.currentTimeMillis());
        }
        
        /**
         * Check if grace period has expired.
         */
        public boolean isExpired() {
            return System.currentTimeMillis() >= gracePeriodEnds;
        }
        
        /**
         * Convert to telemetry-friendly map.
         */
        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("playerId", playerId.toString());
            map.put("matchId", matchId);
            map.put("disconnectTime", disconnectTime);
            map.put("gracePeriodEnds", gracePeriodEnds);
            map.put("reason", reason.name());
            map.put("remainingMs", getRemainingMs());
            return map;
        }
    }
    
    private final JavaPlugin plugin;
    private final Map<UUID, DisconnectInfo> disconnectedPlayers = new ConcurrentHashMap<>();
    private final Map<String, Set<UUID>> matchDisconnects = new ConcurrentHashMap<>();
    
    public GracePeriodTracker(JavaPlugin plugin) {
        this.plugin = plugin;
    }
    
    /**
     * Start tracking a disconnected player with a grace period.
     * 
     * @param playerId UUID of the disconnected player
     * @param matchId Match the player was in
     * @param gracePeriodSeconds Time to wait for reconnection
     * @param reason Why the player disconnected
     * @param onTimeout Callback when grace period expires (runs on main thread)
     */
    public void startGracePeriod(UUID playerId, String matchId, int gracePeriodSeconds,
                                DisconnectReason reason, Consumer<UUID> onTimeout) {
        // Cancel existing grace period if any
        cancelGracePeriod(playerId);
        
        long disconnectTime = System.currentTimeMillis();
        
        // Schedule timeout task
        BukkitTask timeoutTask = Bukkit.getScheduler().runTaskLater(plugin, () -> {
            LOGGER.info("Grace period expired for player " + playerId + " in match " + matchId);
            
            // Remove tracking
            disconnectedPlayers.remove(playerId);
            Set<UUID> matchSet = matchDisconnects.get(matchId);
            if (matchSet != null) {
                matchSet.remove(playerId);
                if (matchSet.isEmpty()) {
                    matchDisconnects.remove(matchId);
                }
            }
            
            // Call timeout handler
            if (onTimeout != null) {
                onTimeout.accept(playerId);
            }
        }, gracePeriodSeconds * 20L); // Convert seconds to ticks
        
        // Store disconnect info
        DisconnectInfo info = new DisconnectInfo(playerId, matchId, disconnectTime,
                gracePeriodSeconds, reason, timeoutTask);
        disconnectedPlayers.put(playerId, info);
        
        matchDisconnects.computeIfAbsent(matchId, k -> ConcurrentHashMap.newKeySet()).add(playerId);
        
        LOGGER.info("Started " + gracePeriodSeconds + "s grace period for player " + playerId + 
                   " in match " + matchId);
    }
    
    /**
     * Cancel a player's grace period (e.g., they reconnected).
     * 
     * @param playerId UUID of the player
     * @return true if a grace period was active and cancelled
     */
    public boolean cancelGracePeriod(UUID playerId) {
        DisconnectInfo info = disconnectedPlayers.remove(playerId);
        if (info == null) {
            return false;
        }
        
        // Cancel the timeout task
        if (info.timeoutTask != null && !info.timeoutTask.isCancelled()) {
            info.timeoutTask.cancel();
        }
        
        // Remove from match tracking
        Set<UUID> matchSet = matchDisconnects.get(info.matchId);
        if (matchSet != null) {
            matchSet.remove(playerId);
            if (matchSet.isEmpty()) {
                matchDisconnects.remove(info.matchId);
            }
        }
        
        LOGGER.info("Cancelled grace period for player " + playerId);
        return true;
    }
    
    /**
     * Check if a player is in a grace period.
     */
    public boolean isInGracePeriod(UUID playerId) {
        return disconnectedPlayers.containsKey(playerId);
    }
    
    /**
     * Get disconnect info for a player.
     */
    public DisconnectInfo getDisconnectInfo(UUID playerId) {
        return disconnectedPlayers.get(playerId);
    }
    
    /**
     * Get all disconnected players for a match.
     */
    public Set<UUID> getDisconnectedPlayers(String matchId) {
        Set<UUID> set = matchDisconnects.get(matchId);
        return set != null ? new HashSet<>(set) : new HashSet<>();
    }
    
    /**
     * Get disconnect info for all players in a match.
     */
    public List<DisconnectInfo> getMatchDisconnects(String matchId) {
        List<DisconnectInfo> infos = new ArrayList<>();
        Set<UUID> playerIds = matchDisconnects.get(matchId);
        if (playerIds != null) {
            for (UUID playerId : playerIds) {
                DisconnectInfo info = disconnectedPlayers.get(playerId);
                if (info != null) {
                    infos.add(info);
                }
            }
        }
        return infos;
    }
    
    /**
     * Clear all grace periods for a match (e.g., match ended).
     */
    public void clearMatch(String matchId) {
        Set<UUID> playerIds = matchDisconnects.remove(matchId);
        if (playerIds != null) {
            for (UUID playerId : playerIds) {
                DisconnectInfo info = disconnectedPlayers.remove(playerId);
                if (info != null && info.timeoutTask != null) {
                    info.timeoutTask.cancel();
                }
            }
            LOGGER.info("Cleared " + playerIds.size() + " grace periods for match " + matchId);
        }
    }
    
    /**
     * Clear all tracked grace periods.
     */
    public void clearAll() {
        for (DisconnectInfo info : disconnectedPlayers.values()) {
            if (info.timeoutTask != null) {
                info.timeoutTask.cancel();
            }
        }
        disconnectedPlayers.clear();
        matchDisconnects.clear();
        LOGGER.info("Cleared all grace periods");
    }
    
    /**
     * Get count of players currently in grace period.
     */
    public int getActiveCount() {
        return disconnectedPlayers.size();
    }
}
