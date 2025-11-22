package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Statistic;
import org.bukkit.attribute.Attribute;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.logging.Logger;

/**
 * Service that tracks player telemetry data for active matches and updates match state
 * Based on logic from warrior-telemetry plugin
 */
public class MatchTelemetryService {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private final JavaPlugin plugin;
    private final String convexSiteUrl;
    private final Map<String, Set<UUID>> activeMatches = new HashMap<>(); // matchId -> Set of player UUIDs
    private final Map<UUID, String> playerToMatch = new HashMap<>(); // player UUID -> matchId
    private int taskId = -1;
    private static final long UPDATE_INTERVAL_TICKS = 20L; // Update every second (20 ticks)

    public MatchTelemetryService(JavaPlugin plugin, String convexSiteUrl) {
        this.plugin = plugin;
        this.convexSiteUrl = convexSiteUrl;
    }

    public void start() {
        if (taskId != -1) {
            LOGGER.warning("MatchTelemetryService is already running");
            return;
        }

        LOGGER.info("Starting MatchTelemetryService with Convex URL: " + convexSiteUrl);

        // Run the telemetry update task periodically
        taskId = Bukkit.getScheduler().runTaskTimerAsynchronously(
            plugin,
            this::updateMatchStates,
            0L, // Start immediately
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

    /**
     * Register a player as being in a match
     */
    public void registerPlayerInMatch(UUID playerId, String matchId) {
        activeMatches.computeIfAbsent(matchId, k -> new HashSet<>()).add(playerId);
        playerToMatch.put(playerId, matchId);
        LOGGER.info("Registered player " + playerId + " in match " + matchId);
    }

    /**
     * Unregister a player from their match
     */
    public void unregisterPlayer(UUID playerId) {
        String matchId = playerToMatch.remove(playerId);
        if (matchId != null) {
            Set<UUID> players = activeMatches.get(matchId);
            if (players != null) {
                players.remove(playerId);
                if (players.isEmpty()) {
                    activeMatches.remove(matchId);
                }
            }
            LOGGER.info("Unregistered player " + playerId + " from match " + matchId);
        }
    }

    /**
     * Get the match ID for a player
     */
    public String getMatchIdForPlayer(UUID playerId) {
        return playerToMatch.get(playerId);
    }

    /**
     * Check if a player is in an active match
     */
    public boolean isPlayerInMatch(UUID playerId) {
        return playerToMatch.containsKey(playerId);
    }

    /**
     * Update match states for all active matches
     */
    private void updateMatchStates() {
        try {
            for (Map.Entry<String, Set<UUID>> entry : activeMatches.entrySet()) {
                String matchId = entry.getKey();
                Set<UUID> playerIds = entry.getValue();

                // Collect telemetry data for all players in this match
                JSONObject matchState = collectMatchTelemetry(matchId, playerIds);

                // Update match state via HTTP route
                updateMatchState(matchId, matchState);
            }
        } catch (Exception e) {
            LOGGER.severe("Error updating match states: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Collect telemetry data for all players in a match
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
                    JSONObject playerData = collectPlayerTelemetry(player);
                    players.put(playerData);
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
     * Collect telemetry data for a single player
     * Based on updatePlayerScoreboard from WarriorEventListener
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
        JSONObject equipment = new JSONObject();
        
        ItemStack mainHand = player.getInventory().getItemInMainHand();
        equipment.put("mainHand", (mainHand != null && !mainHand.getType().equals(Material.AIR))
            ? formatItemName(mainHand.getType()) : "None");

        ItemStack helmet = player.getInventory().getHelmet();
        equipment.put("helmet", (helmet != null && !helmet.getType().equals(Material.AIR))
            ? formatItemName(helmet.getType()) : "None");

        ItemStack chestplate = player.getInventory().getChestplate();
        equipment.put("chestplate", (chestplate != null && !chestplate.getType().equals(Material.AIR))
            ? formatItemName(chestplate.getType()) : "None");

        ItemStack leggings = player.getInventory().getLeggings();
        equipment.put("leggings", (leggings != null && !leggings.getType().equals(Material.AIR))
            ? formatItemName(leggings.getType()) : "None");

        ItemStack boots = player.getInventory().getBoots();
        equipment.put("boots", (boots != null && !boots.getType().equals(Material.AIR))
            ? formatItemName(boots.getType()) : "None");

        playerData.put("equipment", equipment);

        // Combat Stats
        playerData.put("kills", player.getStatistic(Statistic.PLAYER_KILLS));
        playerData.put("deaths", player.getStatistic(Statistic.DEATHS));

        // Nearby players count
        int nearbyCount = 0;
        for (Player nearbyPlayer : Bukkit.getOnlinePlayers()) {
            if (!nearbyPlayer.equals(player) && nearbyPlayer.getWorld().equals(player.getWorld())) {
                double distance = nearbyPlayer.getLocation().distance(player.getLocation());
                if (distance <= 20.0) {
                    nearbyCount++;
                }
            }
        }
        playerData.put("nearbyPlayers", nearbyCount);

        return playerData;
        } catch (JSONException e) {
            LOGGER.severe("Error collecting player telemetry: " + e.getMessage());
            e.printStackTrace();
            return new JSONObject();
        }
    }

    /**
     * Format item name from Material enum
     * Based on formatItemName from WarriorEventListener
     */
    private String formatItemName(Material material) {
        String name = material.name().replace("_", " ").toLowerCase();
        String[] words = name.split(" ");
        StringBuilder formatted = new StringBuilder();
        for (String word : words) {
            if (formatted.length() > 0) formatted.append(" ");
            formatted.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        String result = formatted.toString();
        // Truncate if too long
        return result.length() > 15 ? result.substring(0, 12) + "..." : result;
    }

    /**
     * Update match state via HTTP route
     */
    private void updateMatchState(String matchId, JSONObject matchState) {
        try {
            String urlString = convexSiteUrl + "/matches/update";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            JSONObject requestBody = new JSONObject();
            requestBody.put("match_id", matchId); // Use match_id (with underscore) as expected by HTTP route
            requestBody.put("match_state", matchState);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to update match state for " + matchId + ": HTTP " + responseCode);
                BufferedReader errorReader = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8)
                );
                StringBuilder errorResponse = new StringBuilder();
                String line;
                while ((line = errorReader.readLine()) != null) {
                    errorResponse.append(line);
                }
                errorReader.close();
                LOGGER.warning("Error response: " + errorResponse.toString());
            }
        } catch (Exception e) {
            LOGGER.severe("Error updating match state: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

