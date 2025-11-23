package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import ai.blockwarriors.commands.debug.CreateMatchCommand;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.logging.Logger;

/**
 * Service that polls Convex HTTP routes for queued matches and starts them
 * when all players (tokens) have logged in.
 */
public class MatchPollingService {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private final JavaPlugin plugin;
    private final String convexSiteUrl;
    private MatchManager matchManager;
    private int taskId = -1;
    private static final int POLL_INTERVAL_SECONDS = 5; // Poll every 5 seconds

    public MatchPollingService(JavaPlugin plugin, String convexSiteUrl) {
        this.plugin = plugin;
        this.convexSiteUrl = convexSiteUrl;
    }

    public void setMatchManager(MatchManager matchManager) {
        this.matchManager = matchManager;
    }

    public void start() {
        if (taskId != -1) {
            LOGGER.warning("MatchPollingService is already running");
            return;
        }

        LOGGER.info("Starting MatchPollingService with Convex URL: " + convexSiteUrl);

        // Run the polling task every POLL_INTERVAL_SECONDS seconds
        taskId = Bukkit.getScheduler().runTaskTimerAsynchronously(
                plugin,
                this::pollAndProcessMatches,
                0L, // Start immediately
                POLL_INTERVAL_SECONDS * 20L // Convert seconds to ticks (20 ticks = 1 second)
        ).getTaskId();
    }

    public void stop() {
        if (taskId != -1) {
            Bukkit.getScheduler().cancelTask(taskId);
            taskId = -1;
            LOGGER.info("MatchPollingService stopped");
        }
    }

    private void pollAndProcessMatches() {
        try {
            // Fetch queued matches
            List<JSONObject> queuedMatches = fetchQueuedMatches();

            for (JSONObject match : queuedMatches) {
                String matchId = match.getString("match_id");
                String matchStatus = match.optString("match_status", "");

                // Handle Queuing matches - need acknowledgment
                if ("Queuing".equals(matchStatus)) {
                    // Acknowledge the match - this generates tokens and updates status to "Waiting"
                    String matchType = match.optString("match_type", "");
                    if (!acknowledgeMatch(matchId, matchType)) {
                        LOGGER.warning("Failed to acknowledge match " + matchId + ", skipping");
                        continue;
                    }
                    LOGGER.info("Acknowledged match " + matchId + " and generated tokens");
                    // After acknowledgment, status becomes "Waiting", so check readiness now
                    matchStatus = "Waiting"; // Update status for immediate readiness check
                    // Fall through to check readiness
                }

                // Handle Waiting matches - check readiness and start if ready
                if ("Waiting".equals(matchStatus)) {
                    // Check if match is ready (all tokens used)
                    JSONObject readiness = checkMatchReadiness(matchId);

                    if (readiness == null) {
                        LOGGER.warning("Failed to check readiness for match " + matchId + ", skipping");
                        continue; // Error occurred, skip this match
                    }

                    boolean ready = readiness.getBoolean("ready");
                    int totalTokens = readiness.getInt("totalTokens");
                    int usedTokens = readiness.getInt("usedTokens");

                    // Check for error in readiness response
                    if (readiness.has("error")) {
                        String error = readiness.optString("error", "Unknown error");
                        LOGGER.warning(String.format(
                                "Match %s readiness check error: %s",
                                matchId, error));
                        continue; // Skip this match
                    }

                    LOGGER.info(String.format(
                            "Match %s: %d/%d tokens used (ready: %s)",
                            matchId, usedTokens, totalTokens, ready));

                    // Only start match if all tokens have been used
                    if (ready && totalTokens > 0 && usedTokens == totalTokens) {
                        LOGGER.info(String.format(
                                "Match %s is ready! Starting match with %d/%d tokens used.",
                                matchId, usedTokens, totalTokens));
                        // All tokens have been used - start the match
                        processReadyMatch(match, readiness);
                    } else {
                        LOGGER.info(String.format(
                                "Match %s not ready yet. %d/%d tokens used.",
                                matchId, usedTokens, totalTokens));
                    }
                    continue; // Processed this Waiting match, move to next
                }

                // Handle Playing matches - if website clicked Begin Game but match hasn't
                // started yet
                if ("Playing".equals(matchStatus)) {
                    // Check if match has actually started (registered in MatchManager)
                    // If not, start it now
                    boolean matchStarted = false;
                    if (matchManager != null) {
                        // Try to get world name - if it exists, match has started
                        String worldName = matchManager.getWorldNameForMatch(matchId);
                        matchStarted = (worldName != null);
                    }

                    if (!matchStarted) {
                        // Match is Playing but not registered, so it hasn't started yet
                        List<Player> players = getPlayersForMatch(matchId);
                        if (players.size() > 0) {
                            LOGGER.info("Match " + matchId + " is Playing but not started yet. Starting now...");
                            Bukkit.getScheduler().runTask(plugin, () -> {
                                startMatch(match, players);
                            });
                        } else {
                            LOGGER.warning("Match " + matchId + " is Playing but no players found. Cannot start.");
                        }
                    }
                    continue;
                }

                // Skip matches in other statuses (Finished, Terminated)
                // These are already handled or completed
            }
        } catch (Exception e) {
            LOGGER.severe("Error polling matches: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Fetch matches that need processing:
     * - "Queuing" status: Need acknowledgment and token generation
     * - "Waiting" status: Need readiness check and potential start
     * - "Playing" status: Need to check if match has actually started (website may
     * have clicked Begin Game)
     */
    private List<JSONObject> fetchQueuedMatches() {
        List<JSONObject> allMatches = new ArrayList<>();

        // Fetch Queuing matches (need acknowledgment)
        try {
            String urlString = convexSiteUrl + "/matches?status=Queuing";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONArray matchesArray;
                try {
                    matchesArray = new JSONArray(response.toString());
                    for (int i = 0; i < matchesArray.length(); i++) {
                        allMatches.add(matchesArray.getJSONObject(i));
                    }
                } catch (JSONException e) {
                    LOGGER.warning("Failed to parse Queuing matches JSON: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            LOGGER.warning("Error fetching Queuing matches: " + e.getMessage());
        }

        // Fetch Waiting matches (need readiness check)
        try {
            String urlString = convexSiteUrl + "/matches?status=Waiting";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONArray matchesArray;
                try {
                    matchesArray = new JSONArray(response.toString());
                    for (int i = 0; i < matchesArray.length(); i++) {
                        allMatches.add(matchesArray.getJSONObject(i));
                    }
                } catch (JSONException e) {
                    LOGGER.warning("Failed to parse Waiting matches JSON: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            LOGGER.warning("Error fetching Waiting matches: " + e.getMessage());
        }

        // Fetch Playing matches (may need to be started if website clicked Begin Game)
        try {
            String urlString = convexSiteUrl + "/matches?status=Playing";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONArray matchesArray;
                try {
                    matchesArray = new JSONArray(response.toString());
                    for (int i = 0; i < matchesArray.length(); i++) {
                        allMatches.add(matchesArray.getJSONObject(i));
                    }
                } catch (JSONException e) {
                    LOGGER.warning("Failed to parse Playing matches JSON: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            LOGGER.warning("Error fetching Playing matches: " + e.getMessage());
        }

        return allMatches;
    }

    /**
     * Acknowledge a queued match - generates tokens and updates status to "Waiting"
     * Returns true if successful, false otherwise
     */
    private boolean acknowledgeMatch(String matchId, String matchType) {
        try {
            String urlString = convexSiteUrl + "/matches/acknowledge";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            // Determine tokens per team from match type
            int tokensPerTeam = 1; // Default
            if ("bedwars".equals(matchType)) {
                tokensPerTeam = 4;
            } else if ("ctf".equals(matchType)) {
                tokensPerTeam = 5;
            } else if ("pvp".equals(matchType)) {
                tokensPerTeam = 1;
            }

            JSONObject requestBody = new JSONObject();
            requestBody.put("match_id", matchId);
            requestBody.put("tokens_per_team", tokensPerTeam);
            requestBody.put("match_type", matchType);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to acknowledge match " + matchId + ": HTTP " + responseCode);
                BufferedReader errorReader = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
                StringBuilder errorResponse = new StringBuilder();
                String line;
                while ((line = errorReader.readLine()) != null) {
                    errorResponse.append(line);
                }
                errorReader.close();
                LOGGER.warning("Error response: " + errorResponse.toString());
                return false;
            }

            // Read response to verify success
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            // Verify acknowledgment was successful
            JSONObject result = new JSONObject(response.toString());
            if (result.has("tokens")) {
                LOGGER.info("Successfully acknowledged match " + matchId + " and generated tokens");
            } else {
                LOGGER.warning("Acknowledgment response missing tokens for match " + matchId);
            }
            return true;
        } catch (Exception e) {
            LOGGER.severe("Error acknowledging match " + matchId + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private JSONObject checkMatchReadiness(String matchId) {
        try {
            String urlString = convexSiteUrl + "/matches/readiness?match_id=" + matchId;
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to check match readiness: HTTP " + responseCode);
                return null;
            }

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            return new JSONObject(response.toString());
        } catch (Exception e) {
            LOGGER.severe("Error checking match readiness: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private void processReadyMatch(JSONObject match, JSONObject readiness) {
        String matchId;
        try {
            matchId = match.getString("match_id");
        } catch (JSONException e) {
            LOGGER.severe("Error getting match ID: " + e.getMessage());
            e.printStackTrace();
            return;
        }
        LOGGER.info("Match " + matchId + " is ready! All players have logged in. Starting match...");

        // Match status should already be "Waiting" from acknowledge
        // Update to "Playing"
        updateMatchStatus(matchId, "Playing");

        // Get all players who logged in with tokens for this match
        // We need to get tokens and find which players are online
        List<Player> players = getPlayersForMatch(matchId);

        // Start the match on the main thread
        Bukkit.getScheduler().runTask(plugin, () -> {
            startMatch(match, players);
        });
    }

    private void updateMatchStatus(String matchId, String status) {
        try {
            String urlString = convexSiteUrl + "/matches/update";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            JSONObject requestBody = new JSONObject();
            requestBody.put("match_id", matchId); // Use match_id (with underscore) as expected by HTTP route
            requestBody.put("match_status", status);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to update match status: HTTP " + responseCode);
                BufferedReader errorReader = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
                StringBuilder errorResponse = new StringBuilder();
                String line;
                while ((line = errorReader.readLine()) != null) {
                    errorResponse.append(line);
                }
                errorReader.close();
                LOGGER.warning("Error response: " + errorResponse.toString());
            } else {
                LOGGER.info("Updated match " + matchId + " status to " + status);
            }
        } catch (Exception e) {
            LOGGER.severe("Error updating match status: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private List<Player> getPlayersForMatch(String matchId) {
        // Get tokens for this match and find which players logged in with those tokens
        List<Player> players = new ArrayList<>();

        try {
            // Fetch tokens for this match
            String urlString = convexSiteUrl + "/matches/tokens?match_id=" + matchId;
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to get tokens for match: HTTP " + responseCode);
                return players;
            }

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            JSONArray tokensArray = new JSONArray(response.toString());

            // For each token that has a user_id (playerId), find that player
            for (int i = 0; i < tokensArray.length(); i++) {
                JSONObject token = tokensArray.getJSONObject(i);
                if (token.has("user_id") && !token.isNull("user_id")) {
                    String playerId = token.getString("user_id");
                    try {
                        UUID playerUUID = UUID.fromString(playerId);
                        Player player = Bukkit.getPlayer(playerUUID);
                        if (player != null && player.isOnline()) {
                            players.add(player);
                        }
                    } catch (IllegalArgumentException e) {
                        LOGGER.warning("Invalid player UUID in token: " + playerId);
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.severe("Error getting players for match: " + e.getMessage());
            e.printStackTrace();
        }

        return players;
    }

    private void startMatch(JSONObject match, List<Player> players) {
        try {
            String matchType = match.getString("match_type");
            String matchId = match.getString("match_id");

            // Get tokens for this match to determine team assignments
            Map<String, List<String>> teamTokens = getTokensForMatch(matchId);
            List<String> blueTeamTokens = teamTokens.get("blue");
            List<String> redTeamTokens = teamTokens.get("red");

            // Get tokens with player IDs to map players to teams
            Map<String, String> tokenToPlayerId = getTokenToPlayerMapping(matchId);

            // Map players to teams based on their tokens
            List<Player> blueTeamPlayers = new ArrayList<>();
            List<Player> redTeamPlayers = new ArrayList<>();

            for (Player player : players) {
                String playerId = player.getUniqueId().toString();

                // Check if player logged in with a blue team token
                boolean isBlueTeam = false;
                for (String token : blueTeamTokens) {
                    if (tokenToPlayerId.containsKey(token) &&
                            tokenToPlayerId.get(token).equals(playerId)) {
                        isBlueTeam = true;
                        break;
                    }
                }

                if (isBlueTeam) {
                    blueTeamPlayers.add(player);
                } else {
                    // Check if player logged in with a red team token
                    boolean isRedTeam = false;
                    for (String token : redTeamTokens) {
                        if (tokenToPlayerId.containsKey(token) &&
                                tokenToPlayerId.get(token).equals(playerId)) {
                            isRedTeam = true;
                            break;
                        }
                    }

                    if (isRedTeam) {
                        redTeamPlayers.add(player);
                    }
                }
            }

            // If we couldn't assign all players to teams, log a warning
            if (blueTeamPlayers.size() + redTeamPlayers.size() < players.size()) {
                LOGGER.warning("Could not assign all players to teams. " +
                        "Assigned: " + (blueTeamPlayers.size() + redTeamPlayers.size()) +
                        " out of " + players.size());
            }

            // Start match directly on main thread
            Bukkit.getScheduler().runTask(plugin, () -> {
                startMatchDirectly(matchId, matchType, blueTeamPlayers, redTeamPlayers);
            });
        } catch (Exception e) {
            LOGGER.severe("Error starting match: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Map<String, List<String>> getTokensForMatch(String matchId) {
        Map<String, List<String>> result = new HashMap<>();
        List<String> blueTokens = new ArrayList<>();
        List<String> redTokens = new ArrayList<>();

        try {
            // Fetch tokens for this match
            String urlString = convexSiteUrl + "/matches/tokens?match_id=" + matchId;
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to get tokens for match: HTTP " + responseCode);
                result.put("blue", blueTokens);
                result.put("red", redTokens);
                return result;
            }

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            JSONArray tokensArray = new JSONArray(response.toString());

            // Get match info to determine team assignments
            String matchUrlString = convexSiteUrl + "/matches?id=" + matchId;
            URL matchUrl = new URL(matchUrlString);
            HttpURLConnection matchConn = (HttpURLConnection) matchUrl.openConnection();
            matchConn.setRequestMethod("GET");
            matchConn.setRequestProperty("Content-Type", "application/json");

            String blueTeamId = null;
            String redTeamId = null;
            if (matchConn.getResponseCode() == 200) {
                BufferedReader matchReader = new BufferedReader(
                        new InputStreamReader(matchConn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder matchResponse = new StringBuilder();
                while ((line = matchReader.readLine()) != null) {
                    matchResponse.append(line);
                }
                matchReader.close();

                JSONObject match = new JSONObject(matchResponse.toString());
                blueTeamId = match.getString("blue_team_id");
                redTeamId = match.getString("red_team_id");
            }

            // Group tokens by team
            for (int i = 0; i < tokensArray.length(); i++) {
                JSONObject token = tokensArray.getJSONObject(i);
                String tokenValue = token.getString("token");
                String gameTeamId = token.getString("game_team_id");

                if (blueTeamId != null && gameTeamId.equals(blueTeamId)) {
                    blueTokens.add(tokenValue);
                } else if (redTeamId != null && gameTeamId.equals(redTeamId)) {
                    redTokens.add(tokenValue);
                }
            }
        } catch (Exception e) {
            LOGGER.severe("Error getting tokens for match: " + e.getMessage());
            e.printStackTrace();
        }

        result.put("blue", blueTokens);
        result.put("red", redTokens);
        return result;
    }

    private Map<String, String> getTokenToPlayerMapping(String matchId) {
        Map<String, String> tokenToPlayerId = new HashMap<>();

        try {
            // Fetch tokens for this match
            String urlString = convexSiteUrl + "/matches/tokens?match_id=" + matchId;
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to get tokens for match: HTTP " + responseCode);
                return tokenToPlayerId;
            }

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            JSONArray tokensArray = new JSONArray(response.toString());

            // Map token to playerId (user_id field)
            for (int i = 0; i < tokensArray.length(); i++) {
                JSONObject token = tokensArray.getJSONObject(i);
                if (token.has("user_id") && !token.isNull("user_id")) {
                    String tokenValue = token.getString("token");
                    String playerId = token.getString("user_id");
                    tokenToPlayerId.put(tokenValue, playerId);
                }
            }
        } catch (Exception e) {
            LOGGER.severe("Error getting token to player mapping: " + e.getMessage());
            e.printStackTrace();
        }

        return tokenToPlayerId;
    }

    /**
     * Start match directly without Socket.IO
     */
    private void startMatchDirectly(String matchId, String matchType, List<Player> blueTeamPlayers,
            List<Player> redTeamPlayers) {
        try {
            LOGGER.info("Starting match " + matchId + " directly with " +
                    blueTeamPlayers.size() + " blue players and " +
                    redTeamPlayers.size() + " red players");

            // For now, support 1v1 matches (can be extended later)
            if (blueTeamPlayers.size() == 1 && redTeamPlayers.size() == 1) {
                Player bluePlayer = blueTeamPlayers.get(0);
                Player redPlayer = redTeamPlayers.get(0);

                // Create match world and teleport players
                String worldName = CreateMatchCommand.createMatch(bluePlayer, redPlayer);
                if (worldName == null) {
                    LOGGER.severe("Failed to create match world for match " + matchId);
                    return;
                }

                LOGGER.info("Match created between " + bluePlayer.getName() + " and " + redPlayer.getName() +
                        " in world " + worldName);

                // Register match with match manager
                if (matchManager != null) {
                    List<Player> allPlayers = new ArrayList<>();
                    allPlayers.add(bluePlayer);
                    allPlayers.add(redPlayer);
                    matchManager.registerMatch(matchId, worldName, allPlayers);
                }

                // Register players in telemetry service
                if (plugin instanceof ai.blockwarriors.beacon.Plugin) {
                    ai.blockwarriors.beacon.Plugin pluginInstance = (ai.blockwarriors.beacon.Plugin) plugin;
                    if (pluginInstance.getMatchTelemetryService() != null) {
                        pluginInstance.getMatchTelemetryService().registerPlayerInMatch(bluePlayer.getUniqueId(),
                                matchId);
                        pluginInstance.getMatchTelemetryService().registerPlayerInMatch(redPlayer.getUniqueId(),
                                matchId);
                        LOGGER.info("Registered players in match " + matchId + " for telemetry");
                    }
                }
            } else {
                LOGGER.warning("Match type " + matchType + " with " +
                        blueTeamPlayers.size() + " vs " + redTeamPlayers.size() +
                        " players not yet supported. Only 1v1 is supported.");
            }
        } catch (Exception e) {
            LOGGER.severe("Error starting match directly: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
