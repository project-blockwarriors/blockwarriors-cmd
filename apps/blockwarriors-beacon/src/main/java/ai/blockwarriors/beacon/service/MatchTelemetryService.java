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

import ai.blockwarriors.beacon.game.BaseGame;
import ai.blockwarriors.beacon.game.DisconnectReason;
import ai.blockwarriors.beacon.game.DisconnectResult;
import ai.blockwarriors.beacon.util.ConvexClient;
import ai.blockwarriors.beacon.util.ConvexResponseParser;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * Service that tracks player telemetry data for active matches and updates match state.
 * 
 * API calls accept arrays to minimize Convex usage:
 * - Fetch match statuses for all active matches
 * - Update match states
 * 
 * Telemetry includes:
 * - Base player stats (health, position, equipment)
 * - Game-specific state from BaseGame.getGameState()
 * - Disconnect/reconnect events
 */
public class MatchTelemetryService {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private static final long UPDATE_INTERVAL_TICKS = 20L; // Update every second (20 ticks)

    /**
     * Represents a disconnect or reconnect event for telemetry.
     */
    public static class DisconnectEvent {
        public final String type; // "disconnect" or "reconnect"
        public final UUID playerId;
        public final long timestamp;
        public final DisconnectReason reason; // null for reconnects
        public final DisconnectResult result; // null for reconnects
        public final int gracePeriodSeconds; // 0 for instant forfeit or reconnect
        
        public DisconnectEvent(String type, UUID playerId, DisconnectReason reason, 
                              DisconnectResult result, int gracePeriodSeconds) {
            this.type = type;
            this.playerId = playerId;
            this.timestamp = System.currentTimeMillis();
            this.reason = reason;
            this.result = result;
            this.gracePeriodSeconds = gracePeriodSeconds;
        }
        
        public JSONObject toJSON() {
            JSONObject json = new JSONObject();
            json.put("type", type);
            json.put("playerId", playerId.toString());
            json.put("timestamp", timestamp);
            if (reason != null) {
                json.put("reason", reason.name());
            }
            if (result != null) {
                json.put("result", result.name());
            }
            if (gracePeriodSeconds > 0) {
                json.put("gracePeriodSeconds", gracePeriodSeconds);
                json.put("gracePeriodEnds", timestamp + (gracePeriodSeconds * 1000L));
            }
            return json;
        }
    }

    /**
     * Per-match tracking state.
     */
    private static class MatchState {
        final Set<UUID> playerIds = new HashSet<>();
        final List<DisconnectEvent> events = new ArrayList<>();
        final Set<UUID> disconnectedPlayers = ConcurrentHashMap.newKeySet();
        JSONObject finalTelemetry; // captured at moment of match end, sent on next update
    }

    private final JavaPlugin plugin;
    private final ConvexClient convexClient;
    private final Map<String, MatchState> matches = new HashMap<>();
    private final Map<UUID, String> playerToMatch = new HashMap<>(); // reverse lookup
    private MatchManager matchManager; // For accessing game instances
    private int taskId = -1;

    public MatchTelemetryService(JavaPlugin plugin, String convexSiteUrl, String convexHttpSecret) {
        this.plugin = plugin;
        this.convexClient = new ConvexClient(convexSiteUrl, convexHttpSecret);
    }
    
    /**
     * Set the MatchManager reference for accessing game instances.
     */
    public void setMatchManager(MatchManager matchManager) {
        this.matchManager = matchManager;
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
    
    // ==================== Disconnect/Reconnect Events ====================
    
    /**
     * Record a player disconnect event.
     * 
     * @param matchId Match the player disconnected from
     * @param playerId UUID of the disconnected player
     * @param reason Why the player disconnected
     * @param result How the game handled the disconnect
     * @param gracePeriodSeconds Grace period (0 for instant forfeit)
     */
    public void recordDisconnectEvent(String matchId, UUID playerId, DisconnectReason reason,
                                      DisconnectResult result, int gracePeriodSeconds) {
        MatchState state = matches.get(matchId);
        if (state == null) {
            LOGGER.warning("Cannot record disconnect for match " + matchId + " - not tracked");
            return;
        }
        
        DisconnectEvent event = new DisconnectEvent("disconnect", playerId, reason, result, gracePeriodSeconds);
        state.events.add(event);
        state.disconnectedPlayers.add(playerId);
        
        LOGGER.info("Recorded disconnect event for player " + playerId + " in match " + matchId + 
                   " (result: " + result + ")");
    }
    
    /**
     * Record a player reconnect event.
     * 
     * @param matchId Match the player reconnected to
     * @param playerId UUID of the reconnected player
     */
    public void recordReconnectEvent(String matchId, UUID playerId) {
        MatchState state = matches.get(matchId);
        if (state == null) {
            LOGGER.warning("Cannot record reconnect for match " + matchId + " - not tracked");
            return;
        }
        
        DisconnectEvent event = new DisconnectEvent("reconnect", playerId, null, null, 0);
        state.events.add(event);
        state.disconnectedPlayers.remove(playerId);
        
        LOGGER.info("Recorded reconnect event for player " + playerId + " in match " + matchId);
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
        // Pass the state explicitly to ensure events are included
        JSONObject telemetry = collectMatchTelemetry(matchId, state.playerIds, state);
        
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
        
        // Include total events count
        telemetry.put("totalEvents", state.events.size());
        
        state.finalTelemetry = telemetry;
    }

    // ==================== Telemetry Collection ====================

    /**
     * Collect telemetry data for all players in a match.
     * Merges base telemetry with game-specific state from BaseGame.getGameState().
     */
    private JSONObject collectMatchTelemetry(String matchId, Set<UUID> playerIds) {
        MatchState matchState = matches.get(matchId);
        return collectMatchTelemetry(matchId, playerIds, matchState);
    }
    
    /**
     * Collect telemetry data for all players in a match with explicit MatchState.
     */
    private JSONObject collectMatchTelemetry(String matchId, Set<UUID> playerIds, MatchState matchState) {
        try {
            JSONObject telemetry = new JSONObject();
            telemetry.put("timestamp", System.currentTimeMillis());
            telemetry.put("matchId", matchId);

            // Collect base player telemetry
            JSONArray players = new JSONArray();
            for (UUID playerId : playerIds) {
                Player player = Bukkit.getPlayer(playerId);
                if (player != null && player.isOnline()) {
                    JSONObject playerData = collectPlayerTelemetry(player);
                    // Mark if player was recently disconnected
                    if (matchState != null && matchState.disconnectedPlayers.contains(playerId)) {
                        playerData.put("recentlyDisconnected", true);
                    }
                    players.put(playerData);
                } else if (matchState != null && matchState.disconnectedPlayers.contains(playerId)) {
                    // Include disconnected player with minimal data
                    JSONObject disconnectedPlayer = new JSONObject();
                    disconnectedPlayer.put("playerId", playerId.toString());
                    disconnectedPlayer.put("disconnected", true);
                    players.put(disconnectedPlayer);
                }
            }
            telemetry.put("players", players);
            
            // Include disconnect/reconnect events
            if (matchState != null && !matchState.events.isEmpty()) {
                JSONArray events = new JSONArray();
                for (DisconnectEvent event : matchState.events) {
                    events.put(event.toJSON());
                }
                telemetry.put("events", events);
                
                // Include list of currently disconnected players
                JSONArray disconnectedList = new JSONArray();
                for (UUID pid : matchState.disconnectedPlayers) {
                    disconnectedList.put(pid.toString());
                }
                telemetry.put("disconnectedPlayers", disconnectedList);
            }
            
            // Merge game-specific state from BaseGame
            if (matchManager != null) {
                BaseGame game = matchManager.getGameForMatch(matchId);
                if (game != null) {
                    try {
                        Map<String, Object> gameState = game.getGameState();
                        if (gameState != null && !gameState.isEmpty()) {
                            JSONObject gameSpecific = new JSONObject(gameState);
                            telemetry.put("gameSpecific", gameSpecific);
                            
                            // Also copy some key fields to top level for convenience
                            if (gameState.containsKey("gameType")) {
                                telemetry.put("gameType", gameState.get("gameType"));
                            }
                            if (gameState.containsKey("state")) {
                                telemetry.put("gameState", gameState.get("state"));
                            }
                            if (gameState.containsKey("winnerId")) {
                                telemetry.put("winnerId", gameState.get("winnerId"));
                            }
                        }
                    } catch (Exception e) {
                        LOGGER.warning("Error getting game state for telemetry: " + e.getMessage());
                    }
                }
            }

            return telemetry;
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
