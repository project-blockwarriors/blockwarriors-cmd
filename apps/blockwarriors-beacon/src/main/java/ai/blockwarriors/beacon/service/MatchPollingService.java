package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
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
    private final Set<String> processedMatches = new HashSet<>();
    private MatchManager matchManager;
    private int taskId = -1;
    private static final int POLL_INTERVAL_SECONDS = 2; // Poll every 2 seconds

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
                
                // Skip if we've already processed this match
                if (processedMatches.contains(matchId)) {
                    continue;
                }

                // Check if match is ready (all tokens used)
                JSONObject readiness = checkMatchReadiness(matchId);
                
                if (readiness == null) {
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
                        matchId, error
                    ));
                    continue; // Skip this match
                }

                LOGGER.info(String.format(
                    "Match %s: %d/%d tokens used (ready: %s)",
                    matchId, usedTokens, totalTokens, ready
                ));

                // Only start match if:
                // 1. Match is ready (all tokens used)
                // 2. There are tokens (totalTokens > 0)
                // 3. All tokens have been used (usedTokens == totalTokens)
                if (ready && totalTokens > 0 && usedTokens == totalTokens) {
                    LOGGER.info(String.format(
                        "Match %s is ready! Starting match with %d/%d tokens used.",
                        matchId, usedTokens, totalTokens
                    ));
                    // All tokens have been used - start the match
                    processReadyMatch(match, readiness);
                    processedMatches.add(matchId);
                } else if (ready && totalTokens == 0) {
                    LOGGER.warning(String.format(
                        "Match %s marked as ready but has no tokens! Skipping.",
                        matchId
                    ));
                } else {
                    LOGGER.info(String.format(
                        "Match %s not ready yet. Waiting for %d more tokens to be used.",
                        matchId, totalTokens - usedTokens
                    ));
                }
            }
        } catch (Exception e) {
            LOGGER.severe("Error polling matches: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private List<JSONObject> fetchQueuedMatches() {
        try {
            String urlString = convexSiteUrl + "/matches?status=Queuing";
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.warning("Failed to fetch queued matches: HTTP " + responseCode);
                return new ArrayList<>();
            }

            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            JSONArray matchesArray;
            try {
                matchesArray = new JSONArray(response.toString());
            } catch (JSONException e) {
                LOGGER.warning("Failed to parse matches JSON: " + e.getMessage());
                return new ArrayList<>();
            }
            List<JSONObject> matches = new ArrayList<>();
            for (int i = 0; i < matchesArray.length(); i++) {
                matches.add(matchesArray.getJSONObject(i));
            }

            return matches;
        } catch (Exception e) {
            LOGGER.severe("Error fetching queued matches: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
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
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
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

        // Update match status to "Waiting" first
        updateMatchStatus(matchId, "Waiting");

        // Then update to "Playing"
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
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8)
                );
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
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
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
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
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
                    new InputStreamReader(matchConn.getInputStream(), StandardCharsets.UTF_8)
                );
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
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
            );
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
    private void startMatchDirectly(String matchId, String matchType, List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
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
                        pluginInstance.getMatchTelemetryService().registerPlayerInMatch(bluePlayer.getUniqueId(), matchId);
                        pluginInstance.getMatchTelemetryService().registerPlayerInMatch(redPlayer.getUniqueId(), matchId);
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

