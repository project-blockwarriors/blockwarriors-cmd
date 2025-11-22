package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;

import java.util.*;
import java.util.logging.Logger;

/**
 * Manages active matches, tracking world names and players
 */
public class MatchManager {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private final JavaPlugin plugin;
    private final String convexSiteUrl;
    private MatchTelemetryService telemetryService;
    
    // Map match ID to world name
    private final Map<String, String> matchWorlds = new HashMap<>();
    
    // Map match ID to set of player UUIDs
    private final Map<String, Set<UUID>> matchPlayers = new HashMap<>();
    
    // Map player UUID to match ID
    private final Map<UUID, String> playerMatches = new HashMap<>();

    public MatchManager(JavaPlugin plugin, String convexSiteUrl) {
        this.plugin = plugin;
        this.convexSiteUrl = convexSiteUrl;
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
     * @param deadPlayerId UUID of the player who died (to set health to 0 in final state)
     */
    public void endMatch(String matchId, String winnerPlayerId, UUID deadPlayerId) {
        String worldName = matchWorlds.get(matchId);
        Set<UUID> playerIds = matchPlayers.get(matchId);
        
        if (worldName == null || playerIds == null) {
            LOGGER.warning("Cannot end match " + matchId + " - not found in registry");
            return;
        }

        LOGGER.info("Ending match " + matchId + " (winner: " + (winnerPlayerId != null ? winnerPlayerId : "none") + ", dead player: " + (deadPlayerId != null ? deadPlayerId.toString() : "none") + ")");

        // Send final match state before marking as finished
        if (telemetryService != null) {
            telemetryService.sendFinalMatchState(matchId, winnerPlayerId, deadPlayerId);
        }

        // Update match status to Finished
        updateMatchStatus(matchId, "Finished");

        // Kick players and delete world after a short delay
        new BukkitRunnable() {
            @Override
            public void run() {
                // Kick all players from the match world
                World world = Bukkit.getWorld(worldName);
                if (world != null) {
                    for (UUID playerId : playerIds) {
                        Player player = Bukkit.getPlayer(playerId);
                        if (player != null && player.isOnline()) {
                            // Teleport to main world first
                            World mainWorld = Bukkit.getWorlds().get(0);
                            if (mainWorld != null && !mainWorld.equals(world)) {
                                player.teleport(mainWorld.getSpawnLocation());
                            }
                            player.sendMessage("Match ended! You have been returned to the lobby.");
                        }
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
     * Update match status in Convex
     */
    private void updateMatchStatus(String matchId, String status) {
        try {
            java.net.URL url = new java.net.URL(convexSiteUrl + "/matches/update");
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            org.json.JSONObject requestBody = new org.json.JSONObject();
            requestBody.put("match_id", matchId);
            requestBody.put("match_status", status);

            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to update match status: HTTP " + responseCode);
            } else {
                LOGGER.info("Updated match " + matchId + " status to " + status);
            }
        } catch (Exception e) {
            LOGGER.severe("Error updating match status: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Check if a player is in an active match
     */
    public boolean isPlayerInMatch(UUID playerId) {
        return playerMatches.containsKey(playerId);
    }
}

