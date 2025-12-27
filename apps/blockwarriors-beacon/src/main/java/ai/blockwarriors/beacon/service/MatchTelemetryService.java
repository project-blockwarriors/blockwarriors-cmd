package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Statistic;
import org.bukkit.attribute.Attribute;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import ai.blockwarriors.beacon.util.ConvexClient;
import ai.blockwarriors.beacon.util.ConvexResponseParser;

import java.util.*;
import java.util.logging.Logger;

/**
 * Service that tracks player telemetry data for active matches and updates match state.
 * 
 * API calls accept arrays to minimize Convex usage:
 * - Fetch match statuses for all active matches
 * - Update match states
 */
public class MatchTelemetryService {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private static final long UPDATE_INTERVAL_TICKS = 20L; // Update every second (20 ticks)

    /**
     * Per-match tracking state.
     */
    private static class MatchState {
        final Set<UUID> playerIds = new HashSet<>();
        JSONObject finalTelemetry; // captured at moment of match end, sent on next update
    }

    private final JavaPlugin plugin;
    private final ConvexClient convexClient;
    private final Map<String, MatchState> matches = new HashMap<>();
    private final Map<UUID, String> playerToMatch = new HashMap<>(); // reverse lookup
    private int taskId = -1;

    public MatchTelemetryService(JavaPlugin plugin, String convexSiteUrl, String convexHttpSecret) {
        this.plugin = plugin;
        this.convexClient = new ConvexClient(convexSiteUrl, convexHttpSecret);
    }

    // ==================== Lifecycle ====================

    public void start() {
        if (taskId != -1) {
            LOGGER.warning("MatchTelemetryService is already running");
            return;
        }

        LOGGER.info("Starting MatchTelemetryService with Convex URL: " + convexClient.getBaseUrl());

        taskId = Bukkit.getScheduler().runTaskTimerAsynchronously(
                plugin,
                this::updateLoop,
                0L,
                UPDATE_INTERVAL_TICKS
        ).getTaskId();
    }

    public void stop() {
        if (taskId != -1) {
            Bukkit.getScheduler().cancelTask(taskId);
            taskId = -1;
            LOGGER.info("MatchTelemetryService stopped");
        }
    }

    // ==================== Player Registration ====================

    /**
     * Register a player as being in a match.
     */
    public void registerPlayerInMatch(UUID playerId, String matchId) {
        matches.computeIfAbsent(matchId, k -> new MatchState()).playerIds.add(playerId);
        playerToMatch.put(playerId, matchId);
        LOGGER.info("Registered player " + playerId + " in match " + matchId);
    }

    /**
     * Unregister a player from their match.
     */
    public void unregisterPlayer(UUID playerId) {
        String matchId = playerToMatch.remove(playerId);
        if (matchId != null) {
            MatchState state = matches.get(matchId);
            if (state != null) {
                state.playerIds.remove(playerId);
                if (state.playerIds.isEmpty()) {
                    matches.remove(matchId);
                }
            }
            LOGGER.info("Unregistered player " + playerId + " from match " + matchId);
        }
    }

    /**
     * Get the match ID for a player.
     */
    public String getMatchIdForPlayer(UUID playerId) {
        return playerToMatch.get(playerId);
    }

    /**
     * Check if a player is in an active match.
     */
    public boolean isPlayerInMatch(UUID playerId) {
        return playerToMatch.containsKey(playerId);
    }

    // ==================== Main Update Loop ====================

    /**
     * Main telemetry update loop.
     * 
     * Flow:
     * 1. Fetch status for all active matches
     * 2. Filter out finished/terminated matches
     * 3. Collect telemetry for remaining matches
     * 4. Update match states
     */
    private void updateLoop() {
        try {
            if (matches.isEmpty()) {
                return; // Nothing to update
            }

            // 1. Fetch statuses for all active matches
            List<String> activeMatchIds = new ArrayList<>(matches.keySet());
            Map<String, String> matchStatuses = fetchMatchStatuses(activeMatchIds);

            // 2. Determine which matches to update vs remove
            List<MatchStateUpdate> updates = new ArrayList<>();
            List<String> matchesToRemove = new ArrayList<>();

            for (String matchId : activeMatchIds) {
                MatchState state = matches.get(matchId);
                if (state == null || state.playerIds.isEmpty()) {
                    continue;
                }

                // Final telemetry captured at death - send it and stop tracking
                if (state.finalTelemetry != null) {
                    LOGGER.info("Sending final telemetry for match " + matchId);
                    updates.add(new MatchStateUpdate(matchId, state.finalTelemetry));
                    matchesToRemove.add(matchId);
                    continue;
                }

                String status = matchStatuses.get(matchId);

                // Match not found or no longer playing - stop tracking
                if (status == null || "Finished".equals(status) || "Terminated".equals(status)) {
                    matchesToRemove.add(matchId);
                    continue;
                }

                // Collect regular telemetry for active match
                updates.add(new MatchStateUpdate(matchId, collectMatchTelemetry(matchId, state.playerIds)));
            }

            // 3. Clean up finished matches
            for (String matchId : matchesToRemove) {
                MatchState state = matches.remove(matchId);
                if (state != null) {
                    for (UUID playerId : state.playerIds) {
                        playerToMatch.remove(playerId);
                    }
                }
            }

            // 4. Send updates
            if (!updates.isEmpty()) {
                sendMatchUpdates(updates);
            }

        } catch (Exception e) {
            LOGGER.severe("Error in telemetry update loop: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Container for a single match state update.
     */
    private static class MatchStateUpdate {
        final String matchId;
        final JSONObject matchState;

        MatchStateUpdate(String matchId, JSONObject matchState) {
            this.matchId = matchId;
            this.matchState = matchState;
        }
    }

    // ==================== Final State ====================

    /**
     * Capture and queue final match telemetry to be sent in the next update loop.
     * Must be called on the main thread during death event, before respawn.
     *
     * @param matchId        The match ID
     * @param winnerPlayerId The player ID of the winner (can be null)
     */
    public void queueFinalMatchState(String matchId, String winnerPlayerId) {
        MatchState state = matches.get(matchId);
        if (state == null) {
            LOGGER.warning("Cannot queue final state for match " + matchId + " - not tracked");
            return;
        }

        // Capture telemetry NOW - during death event, dead player's health is still 0
        JSONObject telemetry = collectMatchTelemetry(matchId, state.playerIds);
        
        // Log captured health values for verification
        JSONArray players = telemetry.optJSONArray("players");
        if (players != null) {
            for (int i = 0; i < players.length(); i++) {
                JSONObject p = players.optJSONObject(i);
                if (p != null) {
                    LOGGER.info("Final telemetry captured: " + p.optString("ign") + 
                            " health=" + p.optDouble("health", -1));
                }
            }
        }
        
        // Add final state flags
        if (winnerPlayerId != null) {
            telemetry.put("winner", winnerPlayerId);
        }
        telemetry.put("matchEnded", true);
        telemetry.put("finalState", true);
        
        state.finalTelemetry = telemetry;
    }

    // ==================== Telemetry Collection ====================

    /**
     * Collect telemetry data for all players in a match.
     */
    private JSONObject collectMatchTelemetry(String matchId, Set<UUID> playerIds) {
        try {
            JSONObject matchState = new JSONObject();
            matchState.put("timestamp", System.currentTimeMillis());
            matchState.put("matchId", matchId);

            JSONArray players = new JSONArray();

            for (UUID playerId : playerIds) {
                Player player = Bukkit.getPlayer(playerId);
                if (player != null && player.isOnline()) {
                    players.put(collectPlayerTelemetry(player));
                }
            }

            matchState.put("players", players);
            return matchState;
        } catch (JSONException e) {
            LOGGER.severe("Error collecting match telemetry: " + e.getMessage());
            e.printStackTrace();
            return new JSONObject();
        }
    }

    /**
     * Collect telemetry data for a single player.
     */
    private JSONObject collectPlayerTelemetry(Player player) {
        try {
            JSONObject playerData = new JSONObject();
            Location loc = player.getLocation();

            // Basic info
            playerData.put("playerId", player.getUniqueId().toString());
            playerData.put("ign", player.getName());

            // Health & Food
            double maxHealth = player.getAttribute(Attribute.GENERIC_MAX_HEALTH).getValue();
            playerData.put("health", player.getHealth());
            playerData.put("maxHealth", maxHealth);
            playerData.put("foodLevel", player.getFoodLevel());

            // Position
            JSONObject position = new JSONObject();
            position.put("x", loc.getX());
            position.put("y", loc.getY());
            position.put("z", loc.getZ());
            position.put("world", loc.getWorld().getName());
            playerData.put("position", position);

            // Equipment
            playerData.put("equipment", collectEquipmentData(player));

            // Combat Stats
            playerData.put("kills", player.getStatistic(Statistic.PLAYER_KILLS));
            playerData.put("deaths", player.getStatistic(Statistic.DEATHS));

            // Nearby players count
            playerData.put("nearbyPlayers", countNearbyPlayers(player));

            return playerData;
        } catch (JSONException e) {
            LOGGER.severe("Error collecting player telemetry: " + e.getMessage());
            e.printStackTrace();
            return new JSONObject();
        }
    }

    private JSONObject collectEquipmentData(Player player) {
        JSONObject equipment = new JSONObject();

        equipment.put("mainHand", formatItem(player.getInventory().getItemInMainHand()));
        equipment.put("helmet", formatItem(player.getInventory().getHelmet()));
        equipment.put("chestplate", formatItem(player.getInventory().getChestplate()));
        equipment.put("leggings", formatItem(player.getInventory().getLeggings()));
        equipment.put("boots", formatItem(player.getInventory().getBoots()));

        return equipment;
    }

    private String formatItem(org.bukkit.inventory.ItemStack item) {
        if (item == null || item.getType().equals(Material.AIR)) {
            return "None";
        }
        return formatItemName(item.getType());
    }

    private String formatItemName(Material material) {
        String name = material.name().replace("_", " ").toLowerCase();
        String[] words = name.split(" ");
        StringBuilder formatted = new StringBuilder();
        for (String word : words) {
            if (formatted.length() > 0) {
                formatted.append(" ");
            }
            formatted.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        String result = formatted.toString();
        return result.length() > 15 ? result.substring(0, 12) + "..." : result;
    }

    private int countNearbyPlayers(Player player) {
        int count = 0;
        for (Player nearbyPlayer : Bukkit.getOnlinePlayers()) {
            if (!nearbyPlayer.equals(player) && nearbyPlayer.getWorld().equals(player.getWorld())) {
                double distance = nearbyPlayer.getLocation().distance(player.getLocation());
                if (distance <= 20.0) {
                    count++;
                }
            }
        }
        return count;
    }

    // ==================== API Calls ====================

    /**
     * Fetch match statuses.
     * Returns map of matchId -> status (null if match not found).
     */
    private Map<String, String> fetchMatchStatuses(List<String> matchIds) {
        Map<String, String> results = new HashMap<>();

        if (matchIds.isEmpty()) {
            return results;
        }

        String matchIdsParam = String.join(",", matchIds);

        ConvexResponseParser.ObjectResult result = convexClient.getObject(
                "/matches/info?match_ids=" + matchIdsParam, true,
                "Fetch " + matchIds.size() + " match statuses");

        if (!result.isSuccess()) {
            return results;
        }

        JSONObject data = result.getData();
        for (String matchId : matchIds) {
            JSONObject matchInfo = data.optJSONObject(matchId);
            if (matchInfo != null) {
                results.put(matchId, matchInfo.optString("match_status", null));
            }
        }

        return results;
    }

    /**
     * Send updates for match states. Accepts 1 or more updates in a single request.
     */
    private void sendMatchUpdates(List<MatchStateUpdate> updates) {
        JSONArray updatesArray = new JSONArray();
        for (MatchStateUpdate update : updates) {
            JSONObject updateObj = new JSONObject();
            updateObj.put("match_id", update.matchId);
            updateObj.put("match_state", update.matchState);
            updatesArray.put(updateObj);
        }

        JSONObject requestBody = new JSONObject();
        requestBody.put("updates", updatesArray);

        ConvexResponseParser.ObjectResult result = convexClient.postObject(
                "/matches/update", requestBody, "Update " + updates.size() + " match states");

        if (!result.isSuccess()) {
            LOGGER.warning("Failed to update match states: " + result.getError());
        }
    }
}
