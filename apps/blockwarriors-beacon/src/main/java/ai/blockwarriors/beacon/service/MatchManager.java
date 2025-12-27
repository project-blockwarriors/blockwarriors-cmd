package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.json.JSONArray;
import org.json.JSONObject;

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
    
    // Map match ID to world name
    private final Map<String, String> matchWorlds = new HashMap<>();
    
    // Map match ID to set of player UUIDs
    private final Map<String, Set<UUID>> matchPlayers = new HashMap<>();
    
    // Map player UUID to match ID
    private final Map<UUID, String> playerMatches = new HashMap<>();

    public MatchManager(JavaPlugin plugin, String convexSiteUrl, String convexHttpSecret) {
        this.plugin = plugin;
        this.convexClient = new ConvexClient(convexSiteUrl, convexHttpSecret);
    }

    public void setTelemetryService(MatchTelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * Register a match with its world and players
     */
    public void registerMatch(String matchId, String worldName, List<Player> players) {
        matchWorlds.put(matchId, worldName);
        
        Set<UUID> playerIds = new HashSet<>();
        for (Player player : players) {
            playerIds.add(player.getUniqueId());
            playerMatches.put(player.getUniqueId(), matchId);
        }
        matchPlayers.put(matchId, playerIds);
        
        LOGGER.info("Registered match " + matchId + " with world " + worldName + 
                   " and " + players.size() + " players");
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
     * End a match - update status, delete world, kick players
     */
    public void endMatch(String matchId, String winnerPlayerId) {
        String worldName = matchWorlds.get(matchId);
        Set<UUID> playerIds = matchPlayers.get(matchId);
        
        if (worldName == null || playerIds == null) {
            LOGGER.warning("Cannot end match " + matchId + " - not found in registry");
            return;
        }

        LOGGER.info("Ending match " + matchId + " (winner: " + (winnerPlayerId != null ? winnerPlayerId : "none") + ")");

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

                // Delete the world
                ai.blockwarriors.commands.debug.CreateMatchCommand.deleteMatchWorld(worldName);

                // Unregister players from telemetry service
                if (telemetryService != null) {
                    for (UUID playerId : playerIds) {
                        telemetryService.unregisterPlayer(playerId);
                    }
                }

                // Clean up registry
                matchWorlds.remove(matchId);
                matchPlayers.remove(matchId);
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
}

