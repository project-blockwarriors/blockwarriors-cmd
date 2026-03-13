package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.util.ConvexClient;
import ai.blockwarriors.beacon.util.ConvexResponseParser;

import java.util.*;
import java.util.logging.Logger;

/**
 * Polls Convex for queued matches and orchestrates the match lifecycle.
 *
 * Responsibilities (orchestration only):
 * 1. Poll for matches by status
 * 2. Acknowledge Queuing matches
 * 3. Check readiness for Waiting matches
 * 4. Delegate match initialization to MatchInitializer
 *
 * World creation and game setup are handled by MatchInitializer.
 * API calls for tokens/readiness are inline (simple HTTP gets).
 */
public class MatchPollingService {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private static final int POLL_INTERVAL_SECONDS = 5;

    private final JavaPlugin plugin;
    private final ConvexClient convexClient;
    private final MatchInitializer matchInitializer;
    private MatchManager matchManager;
    private int taskId = -1;

    public MatchPollingService(JavaPlugin plugin, String convexSiteUrl, String convexHttpSecret) {
        this.plugin = plugin;
        this.convexClient = new ConvexClient(convexSiteUrl, convexHttpSecret);
        this.matchInitializer = new MatchInitializer(plugin);
    }

    public void setMatchManager(MatchManager matchManager) {
        this.matchManager = matchManager;
        this.matchInitializer.setMatchManager(matchManager);
    }

    public void setArenaManager(ai.blockwarriors.beacon.arena.ArenaManager arenaManager) {
        this.matchInitializer.setArenaManager(arenaManager);
    }

    public MatchInitializer getMatchInitializer() {
        return matchInitializer;
    }

    public void start() {
        if (taskId != -1) {
            LOGGER.warning("MatchPollingService is already running");
            return;
        }

        LOGGER.info("Starting MatchPollingService with Convex URL: " + convexClient.getBaseUrl());

        taskId = Bukkit.getScheduler().runTaskTimerAsynchronously(
                plugin,
                this::pollLoop,
                0L,
                POLL_INTERVAL_SECONDS * 20L
        ).getTaskId();
    }

    public void stop() {
        if (taskId != -1) {
            Bukkit.getScheduler().cancelTask(taskId);
            taskId = -1;
            LOGGER.info("MatchPollingService stopped");
        }
    }

    // ==================== Main Polling Loop ====================

    private void pollLoop() {
        try {
            List<JSONObject> matches = fetchMatchesByStatus();
            if (matches.isEmpty()) {
                return;
            }

            // Group matches by status
            List<JSONObject> queuingMatches = new ArrayList<>();
            List<JSONObject> waitingMatches = new ArrayList<>();
            List<JSONObject> playingMatches = new ArrayList<>();

            for (JSONObject match : matches) {
                String status = match.optString("match_status", "");
                if (GameConfig.STATUS_QUEUING.equals(status)) {
                    queuingMatches.add(match);
                } else if (GameConfig.STATUS_WAITING.equals(status)) {
                    waitingMatches.add(match);
                } else if (GameConfig.STATUS_PLAYING.equals(status)) {
                    playingMatches.add(match);
                }
            }

            // Acknowledge Queuing matches
            List<String> newlyAcknowledgedIds = new ArrayList<>();
            for (JSONObject match : queuingMatches) {
                String matchId = match.getString("match_id");
                if (acknowledgeMatch(matchId)) {
                    LOGGER.info("Acknowledged match " + matchId + " and generated tokens");
                    newlyAcknowledgedIds.add(matchId);
                }
            }

            // Collect all Waiting match IDs
            List<String> waitingMatchIds = new ArrayList<>();
            Map<String, JSONObject> matchById = new HashMap<>();

            for (JSONObject match : waitingMatches) {
                String matchId = match.getString("match_id");
                waitingMatchIds.add(matchId);
                matchById.put(matchId, match);
            }

            for (JSONObject match : queuingMatches) {
                String matchId = match.getString("match_id");
                if (newlyAcknowledgedIds.contains(matchId)) {
                    waitingMatchIds.add(matchId);
                    matchById.put(matchId, match);
                }
            }

            // Check readiness
            List<String> readyMatchIds = new ArrayList<>();
            if (!waitingMatchIds.isEmpty()) {
                JSONObject readinessResults = checkReadiness(waitingMatchIds);
                if (readinessResults != null) {
                    for (String matchId : waitingMatchIds) {
                        JSONObject readiness = readinessResults.optJSONObject(matchId);
                        if (readiness != null) {
                            boolean ready = readiness.optBoolean("ready", false);
                            int totalTokens = readiness.optInt("totalTokens", 0);
                            int usedTokens = readiness.optInt("usedTokens", 0);

                            LOGGER.info(String.format("Match %s: %d/%d tokens used (ready: %s)",
                                    matchId, usedTokens, totalTokens, ready));

                            if (ready && totalTokens > 0 && usedTokens == totalTokens) {
                                readyMatchIds.add(matchId);
                            }
                        }
                    }
                }
            }

            // Fetch tokens and start ready matches
            if (!readyMatchIds.isEmpty()) {
                Map<String, MatchInitializer.MatchTokenData> tokenDataByMatch =
                        fetchTokenData(readyMatchIds, matchById);

                updateMatchStatus(readyMatchIds, GameConfig.STATUS_PLAYING);

                for (String matchId : readyMatchIds) {
                    JSONObject match = matchById.get(matchId);
                    MatchInitializer.MatchTokenData tokenData = tokenDataByMatch.get(matchId);

                    if (match != null && tokenData != null) {
                        String matchType = match.optString("match_type", "pvp");
                        LOGGER.info("Match " + matchId + " is ready! Starting match...");
                        matchInitializer.initiateMatchStart(matchId, matchType, tokenData);
                    }
                }
            }

            // Handle Playing matches — recovery for Beacon restarts
            for (JSONObject match : playingMatches) {
                String matchId = match.getString("match_id");
                handlePlayingMatch(match, matchId);
            }

        } catch (Exception e) {
            LOGGER.severe("Error polling matches: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ==================== Status Handlers ====================

    private void handlePlayingMatch(JSONObject match, String matchId) {
        if (isMatchRegisteredLocally(matchId)) {
            return;
        }

        LOGGER.info("Match " + matchId + " is Playing but not registered locally. Recovering...");

        Map<String, JSONObject> matchById = new HashMap<>();
        matchById.put(matchId, match);
        Map<String, MatchInitializer.MatchTokenData> tokenDataByMatch =
                fetchTokenData(Collections.singletonList(matchId), matchById);

        MatchInitializer.MatchTokenData tokenData = tokenDataByMatch.get(matchId);
        if (tokenData != null) {
            String matchType = match.optString("match_type", "pvp");
            matchInitializer.initiateMatchStart(matchId, matchType, tokenData);
        }
    }

    private boolean isMatchRegisteredLocally(String matchId) {
        if (matchManager == null) {
            return false;
        }
        return matchManager.getWorldNameForMatch(matchId) != null;
    }

    // ==================== Token Data Fetching ====================

    private Map<String, MatchInitializer.MatchTokenData> fetchTokenData(
            List<String> matchIds, Map<String, JSONObject> matchById) {
        Map<String, MatchInitializer.MatchTokenData> results = new HashMap<>();

        if (matchIds.isEmpty()) {
            return results;
        }

        try {
            JSONObject allTokens = fetchTokens(matchIds);
            if (allTokens == null) {
                return results;
            }

            JSONObject allMatchInfo = fetchMatches(matchIds);

            for (String matchId : matchIds) {
                List<Player> onlinePlayers = new ArrayList<>();
                List<Player> blueTeamPlayers = new ArrayList<>();
                List<Player> redTeamPlayers = new ArrayList<>();

                String blueTeamId = null;
                String redTeamId = null;
                if (allMatchInfo != null) {
                    JSONObject matchInfo = allMatchInfo.optJSONObject(matchId);
                    if (matchInfo != null) {
                        blueTeamId = matchInfo.optString("blue_team_id", null);
                        redTeamId = matchInfo.optString("red_team_id", null);
                    }
                }

                JSONArray tokensArray = allTokens.optJSONArray(matchId);
                if (tokensArray != null) {
                    for (int i = 0; i < tokensArray.length(); i++) {
                        JSONObject token = tokensArray.getJSONObject(i);

                        if (!token.has("user_id") || token.isNull("user_id")) {
                            continue;
                        }

                        String playerId = token.getString("user_id");
                        Player player = getOnlinePlayer(playerId);
                        if (player == null) {
                            continue;
                        }

                        onlinePlayers.add(player);

                        String gameTeamId = token.optString("game_team_id", null);
                        if (gameTeamId != null) {
                            if (gameTeamId.equals(blueTeamId)) {
                                blueTeamPlayers.add(player);
                            } else if (gameTeamId.equals(redTeamId)) {
                                redTeamPlayers.add(player);
                            }
                        }
                    }
                }

                results.put(matchId, new MatchInitializer.MatchTokenData(
                        onlinePlayers, blueTeamPlayers, redTeamPlayers));
            }

        } catch (Exception e) {
            LOGGER.severe("Error batch fetching token data: " + e.getMessage());
            e.printStackTrace();
        }

        return results;
    }

    private Player getOnlinePlayer(String playerId) {
        try {
            UUID playerUUID = UUID.fromString(playerId);
            Player player = Bukkit.getPlayer(playerUUID);
            return (player != null && player.isOnline()) ? player : null;
        } catch (IllegalArgumentException e) {
            LOGGER.warning("Invalid player UUID: " + playerId);
            return null;
        }
    }

    // ==================== API Calls ====================

    private List<JSONObject> fetchMatchesByStatus() {
        ConvexResponseParser.ArrayResult result = convexClient.getArray(
                "/matches", false, "Fetch all matches");

        if (!result.isSuccess()) {
            return new ArrayList<>();
        }

        Set<String> actionableStatuses = new HashSet<>(Arrays.asList(
                GameConfig.STATUS_QUEUING,
                GameConfig.STATUS_WAITING,
                GameConfig.STATUS_PLAYING
        ));

        List<JSONObject> matches = new ArrayList<>();
        JSONArray matchesArray = result.getData();
        for (int i = 0; i < matchesArray.length(); i++) {
            JSONObject match = matchesArray.getJSONObject(i);
            String status = match.optString("match_status", "");
            if (actionableStatuses.contains(status)) {
                matches.add(match);
            }
        }

        return matches;
    }

    private boolean acknowledgeMatch(String matchId) {
        JSONObject requestBody = new JSONObject();
        requestBody.put("match_id", matchId);

        ConvexResponseParser.ObjectResult result = convexClient.postObject(
                "/matches/acknowledge", requestBody, "Acknowledge match " + matchId);

        if (result.isSuccess()) {
            return true;
        } else {
            LOGGER.warning("Acknowledgment failed for match " + matchId + ": " + result.getError());
            return false;
        }
    }

    private JSONObject checkReadiness(List<String> matchIds) {
        String matchIdsParam = String.join(",", matchIds);

        ConvexResponseParser.ObjectResult result = convexClient.getObject(
                "/matches/readiness?match_ids=" + matchIdsParam, true,
                "Check readiness for " + matchIds.size() + " matches");

        return result.isSuccess() ? result.getData() : null;
    }

    private JSONObject fetchTokens(List<String> matchIds) {
        String matchIdsParam = String.join(",", matchIds);

        ConvexResponseParser.ObjectResult result = convexClient.getObject(
                "/matches/tokens?match_ids=" + matchIdsParam, true,
                "Fetch tokens for " + matchIds.size() + " matches");

        return result.isSuccess() ? result.getData() : null;
    }

    private JSONObject fetchMatches(List<String> matchIds) {
        String matchIdsParam = String.join(",", matchIds);

        ConvexResponseParser.ObjectResult result = convexClient.getObject(
                "/matches/info?match_ids=" + matchIdsParam, true,
                "Fetch " + matchIds.size() + " matches");

        return result.isSuccess() ? result.getData() : null;
    }

    private void updateMatchStatus(List<String> matchIds, String status) {
        JSONArray updates = new JSONArray();
        for (String matchId : matchIds) {
            JSONObject update = new JSONObject();
            update.put("match_id", matchId);
            update.put("match_status", status);
            updates.put(update);
        }

        JSONObject requestBody = new JSONObject();
        requestBody.put("updates", updates);

        ConvexResponseParser.ObjectResult result = convexClient.postObject(
                "/matches/update", requestBody, "Update " + matchIds.size() + " matches to " + status);

        if (result.isSuccess()) {
            LOGGER.info("Updated " + matchIds.size() + " matches to status: " + status);
        }
    }
}
