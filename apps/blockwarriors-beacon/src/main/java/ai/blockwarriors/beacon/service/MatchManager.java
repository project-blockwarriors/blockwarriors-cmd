package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.json.JSONArray;
import org.json.JSONObject;

import ai.blockwarriors.beacon.game.BaseGame;
import ai.blockwarriors.beacon.game.DisconnectPolicy;
import ai.blockwarriors.beacon.game.DisconnectReason;
import ai.blockwarriors.beacon.game.DisconnectResult;
import ai.blockwarriors.beacon.game.GracePeriodTracker;
import ai.blockwarriors.beacon.util.ConvexClient;

import java.util.*;
import java.util.logging.Logger;

/**
 * Manages active matches, tracking world names and players
 */
public class MatchManager {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private final JavaPlugin plugin;
    private final ConvexClient convexClient;
    private MatchTelemetryService telemetryService;
    private final GracePeriodTracker gracePeriodTracker;
    
    // Map match ID to world name
    private final Map<String, String> matchWorlds = new HashMap<>();
    
    // Map match ID to set of player UUIDs
    private final Map<String, Set<UUID>> matchPlayers = new HashMap<>();
    
    // Map player UUID to match ID
    private final Map<UUID, String> playerMatches = new HashMap<>();
    
    // Map match ID to BaseGame instance
    private final Map<String, BaseGame> matchGames = new HashMap<>();

    public MatchManager(JavaPlugin plugin, String convexSiteUrl, String convexHttpSecret) {
        this.plugin = plugin;
        this.convexClient = new ConvexClient(convexSiteUrl, convexHttpSecret);
        this.gracePeriodTracker = new GracePeriodTracker(plugin);
    }

    public void setTelemetryService(MatchTelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }
    
    /**
     * Get the grace period tracker for disconnect handling.
     */
    public GracePeriodTracker getGracePeriodTracker() {
        return gracePeriodTracker;
    }

    /**
     * Register a match with its world and players (legacy, no game instance).
     */
    public void registerMatch(String matchId, String worldName, List<Player> players) {
        registerMatch(matchId, worldName, players, null);
    }

    /**
     * Register a match with its world, players, and game instance.
     * 
     * @param matchId Unique match identifier
     * @param worldName Name of the world for this match
     * @param players List of players in the match
     * @param game BaseGame instance (may be null for legacy matches)
     */
    public void registerMatch(String matchId, String worldName, List<Player> players, BaseGame game) {
        matchWorlds.put(matchId, worldName);
        
        Set<UUID> playerIds = new HashSet<>();
        for (Player player : players) {
            playerIds.add(player.getUniqueId());
            playerMatches.put(player.getUniqueId(), matchId);
        }
        matchPlayers.put(matchId, playerIds);
        
        // Store game instance if provided
        if (game != null) {
            matchGames.put(matchId, game);
            LOGGER.info("Registered match " + matchId + " with game type " + game.getGameType() + 
                       ", world " + worldName + " and " + players.size() + " players");
        } else {
            LOGGER.info("Registered match " + matchId + " (legacy) with world " + worldName + 
                       " and " + players.size() + " players");
        }
    }

    /**
     * Get match ID for a player
     */
    public String getMatchIdForPlayer(UUID playerId) {
        return playerMatches.get(playerId);
    }

    /**
     * Get world name for a match
     */
    public String getWorldNameForMatch(String matchId) {
        return matchWorlds.get(matchId);
    }

    /**
     * Get players in a match
     */
    public Set<UUID> getPlayersInMatch(String matchId) {
        return matchPlayers.getOrDefault(matchId, new HashSet<>());
    }

    /**
     * Get the game instance for a match.
     * 
     * @param matchId Match identifier
     * @return BaseGame instance, or null if not found or legacy match
     */
    public BaseGame getGameForMatch(String matchId) {
        return matchGames.get(matchId);
    }

    /**
     * Check if a match has a game instance (non-legacy).
     */
    public boolean hasGame(String matchId) {
        return matchGames.containsKey(matchId);
    }

    /**
     * End a match - update status, delete world, kick players.
     * Delegates cleanup to the game instance if available.
     */
    public void endMatch(String matchId, String winnerPlayerId) {
        String worldName = matchWorlds.get(matchId);
        Set<UUID> playerIds = matchPlayers.get(matchId);
        BaseGame game = matchGames.get(matchId);
        
        if (worldName == null || playerIds == null) {
            LOGGER.warning("Cannot end match " + matchId + " - not found in registry");
            return;
        }

        LOGGER.info("Ending match " + matchId + " (winner: " + (winnerPlayerId != null ? winnerPlayerId : "none") + ")");
        
        // Clear any active grace periods for this match
        gracePeriodTracker.clearMatch(matchId);

        // Call game cleanup if we have a game instance
        if (game != null) {
            try {
                game.cleanup();
                LOGGER.info("Game cleanup completed for match " + matchId);
            } catch (Exception e) {
                LOGGER.severe("Error during game cleanup for match " + matchId + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        // Capture and queue final telemetry NOW while player states are valid
        if (telemetryService != null) {
            telemetryService.queueFinalMatchState(matchId, winnerPlayerId);
        }

        // Update match status to Finished and set the winner
        updateMatchStatus(matchId, "Finished", winnerPlayerId);

        // Kick players and delete world after a short delay
        new BukkitRunnable() {
            @Override
            public void run() {
                for (UUID playerId : playerIds) {
                    Player player = Bukkit.getPlayer(playerId);
                    if (player != null && player.isOnline()) {
                        // Always teleport to the main world, no matter what
                        World mainWorld = Bukkit.getWorlds().get(0);
                        // Do not check for null or same world; let any errors surface visibly
                        player.teleport(mainWorld.getSpawnLocation());
                        player.sendMessage("Match ended! You have been returned to the lobby.");
                    }
                }

                // Delete the world using MatchPollingService's static method
                MatchPollingService.deleteMatchWorld(worldName);

                // Unregister players from telemetry service
                if (telemetryService != null) {
                    for (UUID playerId : playerIds) {
                        telemetryService.unregisterPlayer(playerId);
                    }
                }

                // Clean up registry
                matchWorlds.remove(matchId);
                matchPlayers.remove(matchId);
                matchGames.remove(matchId);
                for (UUID playerId : playerIds) {
                    playerMatches.remove(playerId);
                }

                LOGGER.info("Match " + matchId + " cleaned up and world deleted");
            }
        }.runTaskLater(plugin, 60L); // 3 seconds delay (60 ticks)
    }

    /**
     * Update match status and winner in Convex
     */
    private void updateMatchStatus(String matchId, String status, String winnerPlayerId) {
        JSONObject update = new JSONObject();
        update.put("match_id", matchId);
        update.put("match_status", status);
        if (winnerPlayerId != null) {
            update.put("winner_player_id", winnerPlayerId);
        }

        JSONArray updates = new JSONArray();
        updates.put(update);

        JSONObject requestBody = new JSONObject();
        requestBody.put("updates", updates);

        if (convexClient.postSuccess("/matches/update", requestBody, "Update match " + matchId + " to " + status)) {
            LOGGER.info("Updated match " + matchId + " status to " + status +
                    (winnerPlayerId != null ? " with winner " + winnerPlayerId : ""));
        }
    }

    /**
     * Check if a player is in an active match
     */
    public boolean isPlayerInMatch(UUID playerId) {
        return playerMatches.containsKey(playerId);
    }

    // ==================== Event Delegation ====================

    /**
     * Delegate player death event to the game instance.
     * 
     * @param deadPlayer The player who died
     * @param killer The killer (may be null)
     * @return true if the game handled the event, false if legacy handling should be used
     */
    public boolean delegatePlayerDeath(Player deadPlayer, Player killer) {
        String matchId = getMatchIdForPlayer(deadPlayer.getUniqueId());
        if (matchId == null) {
            return false;
        }

        BaseGame game = matchGames.get(matchId);
        if (game == null || !game.isActive()) {
            return false; // No game instance, use legacy handling
        }

        // Delegate to game
        boolean handled = game.handlePlayerDeath(deadPlayer, killer);
        
        // Check win condition after death
        if (handled && game.checkWinCondition()) {
            UUID winnerId = game.getWinnerId();
            endMatch(matchId, winnerId != null ? winnerId.toString() : null);
        }

        return handled;
    }

    /**
     * Delegate player disconnect event to the game instance.
     * 
     * @param playerId UUID of the disconnecting player
     * @param reason Reason for disconnect
     * @return DisconnectResult indicating how the game handled it
     */
    public DisconnectResult delegatePlayerDisconnect(UUID playerId, DisconnectReason reason) {
        String matchId = getMatchIdForPlayer(playerId);
        if (matchId == null) {
            return null;
        }

        BaseGame game = matchGames.get(matchId);
        if (game == null || !game.isActive()) {
            return null; // No game instance, return null for legacy handling
        }

        // Delegate to game
        DisconnectResult result = game.handlePlayerDisconnect(playerId, reason);
        
        // Handle result based on game's decision
        switch (result) {
            case FORFEIT:
            case GAME_CANCELLED:
                // Game ended immediately
                gracePeriodTracker.clearMatch(matchId);
                UUID winnerId = game.getWinnerId();
                endMatch(matchId, winnerId != null ? winnerId.toString() : null);
                break;
                
            case GRACE_PERIOD:
                // Start grace period tracking
                DisconnectPolicy policy = game.getDisconnectPolicy();
                gracePeriodTracker.startGracePeriod(
                    playerId, 
                    matchId, 
                    policy.getGracePeriodSeconds(),
                    reason,
                    this::handleGracePeriodTimeout
                );
                
                // Notify telemetry about the disconnect
                if (telemetryService != null) {
                    telemetryService.recordDisconnectEvent(matchId, playerId, reason, result, 
                            policy.getGracePeriodSeconds());
                }
                break;
                
            case CONTINUE:
                // Game continues, just record the disconnect
                if (telemetryService != null) {
                    telemetryService.recordDisconnectEvent(matchId, playerId, reason, result, 0);
                }
                break;
        }

        return result;
    }
    
    /**
     * Handle grace period timeout - player didn't reconnect in time.
     * Called from GracePeriodTracker on the main thread.
     */
    private void handleGracePeriodTimeout(UUID playerId) {
        String matchId = getMatchIdForPlayer(playerId);
        if (matchId == null) {
            LOGGER.warning("Grace period timeout for player not in match: " + playerId);
            return;
        }
        
        BaseGame game = matchGames.get(matchId);
        if (game == null) {
            LOGGER.warning("Grace period timeout but no game for match: " + matchId);
            return;
        }
        
        LOGGER.info("Grace period timeout for player " + playerId + " in match " + matchId);
        
        // Treat timeout as forfeit - get opponents as winners
        List<UUID> opponents = game.getOpponents(playerId);
        UUID winnerId = !opponents.isEmpty() ? opponents.get(0) : null;
        
        // Broadcast to remaining players
        for (UUID pid : game.getPlayers()) {
            if (!pid.equals(playerId)) {
                Player p = Bukkit.getPlayer(pid);
                if (p != null && p.isOnline()) {
                    p.sendMessage("§a" + getPlayerName(playerId) + " did not reconnect in time. You win!");
                }
            }
        }
        
        // End the match
        endMatch(matchId, winnerId != null ? winnerId.toString() : null);
    }
    
    /**
     * Get player name by UUID, with fallback.
     */
    private String getPlayerName(UUID playerId) {
        Player player = Bukkit.getPlayer(playerId);
        return player != null ? player.getName() : playerId.toString().substring(0, 8);
    }

    /**
     * Delegate player reconnect event to the game instance.
     * 
     * @param playerId UUID of the reconnecting player
     * @return true if reconnect was handled by the game
     */
    public boolean delegatePlayerReconnect(UUID playerId) {
        // Check if player was in a grace period
        if (!gracePeriodTracker.isInGracePeriod(playerId)) {
            return false;
        }
        
        GracePeriodTracker.DisconnectInfo info = gracePeriodTracker.getDisconnectInfo(playerId);
        if (info == null) {
            return false;
        }
        
        String matchId = info.matchId;
        BaseGame game = matchGames.get(matchId);
        if (game == null) {
            gracePeriodTracker.cancelGracePeriod(playerId);
            return false;
        }

        // Cancel the grace period timeout
        gracePeriodTracker.cancelGracePeriod(playerId);
        
        // Delegate to game for reconnection handling
        boolean handled = game.handlePlayerReconnect(playerId);
        
        if (handled) {
            LOGGER.info("Player " + playerId + " successfully reconnected to match " + matchId);
            
            // Notify telemetry about the reconnect
            if (telemetryService != null) {
                telemetryService.recordReconnectEvent(matchId, playerId);
            }
        }
        
        return handled;
    }
    
    /**
     * Check if a player is in a grace period (disconnected but can reconnect).
     */
    public boolean isPlayerInGracePeriod(UUID playerId) {
        return gracePeriodTracker.isInGracePeriod(playerId);
    }
    
    /**
     * Get the match ID for a player who is in a grace period.
     * Returns null if player is not in a grace period.
     */
    public String getGracePeriodMatchId(UUID playerId) {
        GracePeriodTracker.DisconnectInfo info = gracePeriodTracker.getDisconnectInfo(playerId);
        return info != null ? info.matchId : null;
    }

    /**
     * Delegate a game objective event to the game instance.
     * 
     * @param player Player who triggered the objective
     * @param objectiveType Type of objective
     * @param data Additional objective data
     * @return true if objective was handled
     */
    public boolean delegateObjective(Player player, String objectiveType, Map<String, Object> data) {
        String matchId = getMatchIdForPlayer(player.getUniqueId());
        if (matchId == null) {
            return false;
        }

        BaseGame game = matchGames.get(matchId);
        if (game == null || !game.isActive()) {
            return false;
        }

        // Delegate to game
        boolean handled = game.handleObjective(objectiveType, player, data);
        
        // Check win condition after objective
        if (handled && game.checkWinCondition()) {
            UUID winnerId = game.getWinnerId();
            endMatch(matchId, winnerId != null ? winnerId.toString() : null);
        }

        return handled;
    }
}

