package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.WorldType;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.ArenaManager;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.BaseGame;
import ai.blockwarriors.beacon.game.GameRegistry;
import ai.blockwarriors.beacon.util.ConvexClient;
import ai.blockwarriors.beacon.util.ConvexResponseParser;

import java.io.File;
import java.util.*;
import java.util.logging.Logger;

/**
 * Service that polls Convex HTTP routes for queued matches and starts them
 * when all players (tokens) have logged in.
 * 
 * API calls accept arrays to minimize Convex usage:
 * - Fetch all matches
 * - Check readiness for Waiting matches
 * - Fetch tokens for ready matches
 * - Update status for matches transitioning to Playing
 */
public class MatchPollingService {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private static final int POLL_INTERVAL_SECONDS = 5;

    private final JavaPlugin plugin;
    private final ConvexClient convexClient;
    private MatchManager matchManager;
    private ArenaManager arenaManager;
    private int taskId = -1;

    /**
     * Container for all token-related data needed to start a match.
     */
    private static class MatchTokenData {
        final List<Player> onlinePlayers;
        final List<Player> blueTeamPlayers;
        final List<Player> redTeamPlayers;

        MatchTokenData(List<Player> onlinePlayers, List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
            this.onlinePlayers = onlinePlayers;
            this.blueTeamPlayers = blueTeamPlayers;
            this.redTeamPlayers = redTeamPlayers;
        }

        boolean hasPlayers() {
            return !onlinePlayers.isEmpty();
        }

        boolean hasValidTeams() {
            return !blueTeamPlayers.isEmpty() && !redTeamPlayers.isEmpty();
        }
    }

    public MatchPollingService(JavaPlugin plugin, String convexSiteUrl, String convexHttpSecret) {
        this.plugin = plugin;
        this.convexClient = new ConvexClient(convexSiteUrl, convexHttpSecret);
    }

    public void setMatchManager(MatchManager matchManager) {
        this.matchManager = matchManager;
    }

    public void setArenaManager(ArenaManager arenaManager) {
        this.arenaManager = arenaManager;
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

    /**
     * Main polling loop - processes matches efficiently.
     * 
     * Flow:
     * 1. Fetch all matches
     * 2. Acknowledge Queuing matches (state change)
     * 3. Check readiness for Waiting matches
     * 4. Fetch tokens for ready matches
     * 5. Update status to Playing
     * 6. Start ready matches
     */
    private void pollLoop() {
        try {
            // 1. Fetch all matches in one call
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

            // 2. Process Queuing matches - acknowledge each
            List<String> newlyAcknowledgedIds = new ArrayList<>();
            for (JSONObject match : queuingMatches) {
                String matchId = match.getString("match_id");
                if (acknowledgeMatch(matchId)) {
                    LOGGER.info("Acknowledged match " + matchId + " and generated tokens");
                    newlyAcknowledgedIds.add(matchId);
                }
            }

            // 3. Collect all Waiting match IDs (including newly acknowledged)
            List<String> waitingMatchIds = new ArrayList<>();
            Map<String, JSONObject> matchById = new HashMap<>();
            
            for (JSONObject match : waitingMatches) {
                String matchId = match.getString("match_id");
                waitingMatchIds.add(matchId);
                matchById.put(matchId, match);
            }
            
            // Also add newly acknowledged matches (they're now Waiting)
            for (JSONObject match : queuingMatches) {
                String matchId = match.getString("match_id");
                if (newlyAcknowledgedIds.contains(matchId)) {
                    waitingMatchIds.add(matchId);
                    matchById.put(matchId, match);
                }
            }

            // 4. Check readiness for all Waiting matches
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

            // 5. Fetch tokens and match info for ready matches
            Map<String, MatchTokenData> tokenDataByMatch = new HashMap<>();
            if (!readyMatchIds.isEmpty()) {
                tokenDataByMatch = fetchTokenData(readyMatchIds, matchById);
            }

            // 6. Update status to Playing for ready matches
            if (!readyMatchIds.isEmpty()) {
                updateMatchStatus(readyMatchIds, GameConfig.STATUS_PLAYING);
            }

            // 7. Start each ready match
            for (String matchId : readyMatchIds) {
                JSONObject match = matchById.get(matchId);
                MatchTokenData tokenData = tokenDataByMatch.get(matchId);

                if (match != null && tokenData != null) {
                    LOGGER.info("Match " + matchId + " is ready! Starting match...");
                    initiateMatchStart(match, matchId, tokenData);
                }
            }

            // 8. Handle Playing matches - recovery for when Beacon restarts
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

    /**
     * Handle Playing matches - recovery for when Beacon restarts mid-match.
     * If a match is in Playing status but not registered locally, start it.
     */
    private void handlePlayingMatch(JSONObject match, String matchId) {
        if (isMatchRegisteredLocally(matchId)) {
            return; // Match already running, nothing to do
        }

        LOGGER.info("Match " + matchId + " is Playing but not registered locally. Recovering...");
        
        // Fetch token data for this single match
        Map<String, JSONObject> matchById = new HashMap<>();
        matchById.put(matchId, match);
        Map<String, MatchTokenData> tokenDataByMatch = fetchTokenData(
                Collections.singletonList(matchId), matchById);
        
        MatchTokenData tokenData = tokenDataByMatch.get(matchId);
        if (tokenData != null) {
            initiateMatchStart(match, matchId, tokenData);
        }
    }

    /**
     * Check if a match is already registered in the local MatchManager.
     */
    private boolean isMatchRegisteredLocally(String matchId) {
        if (matchManager == null) {
            return false;
        }
        String worldName = matchManager.getWorldNameForMatch(matchId);
        return worldName != null;
    }

    // ==================== Match Start Flow ====================

    /**
     * Initiate match start with pre-fetched token data.
     */
    private void initiateMatchStart(JSONObject match, String matchId, MatchTokenData tokenData) {
        if (!tokenData.hasPlayers()) {
            LOGGER.warning("Cannot start match " + matchId + ": no online players found");
            return;
        }

        if (!tokenData.hasValidTeams()) {
            LOGGER.warning("Cannot start match " + matchId + ": missing players on one or both teams");
            return;
        }

        String matchType = match.optString("match_type", "pvp");

        // Create match world on main thread (Bukkit API requirement)
        Bukkit.getScheduler().runTask(plugin, () -> {
            createMatchWorld(matchId, matchType, tokenData.blueTeamPlayers, tokenData.redTeamPlayers);
        });
    }

    /**
     * Fetch token data for matches.
     * Makes 2 API calls total: one for tokens, one for match info.
     */
    private Map<String, MatchTokenData> fetchTokenData(List<String> matchIds, Map<String, JSONObject> matchById) {
        Map<String, MatchTokenData> results = new HashMap<>();

        if (matchIds.isEmpty()) {
            return results;
        }

        try {
            // 1. Fetch tokens for all matches
            JSONObject allTokens = fetchTokens(matchIds);
            if (allTokens == null) {
                return results;
            }

            // 2. Fetch match info (for team IDs)
            JSONObject allMatchInfo = fetchMatches(matchIds);

            // 3. Process each match
            for (String matchId : matchIds) {
                List<Player> onlinePlayers = new ArrayList<>();
                List<Player> blueTeamPlayers = new ArrayList<>();
                List<Player> redTeamPlayers = new ArrayList<>();

                // Get team IDs from match info
                String blueTeamId = null;
                String redTeamId = null;
                if (allMatchInfo != null) {
                    JSONObject matchInfo = allMatchInfo.optJSONObject(matchId);
                    if (matchInfo != null) {
                        blueTeamId = matchInfo.optString("blue_team_id", null);
                        redTeamId = matchInfo.optString("red_team_id", null);
                    }
                }

                // Process tokens for this match
                JSONArray tokensArray = allTokens.optJSONArray(matchId);
                if (tokensArray != null) {
                    for (int i = 0; i < tokensArray.length(); i++) {
                        JSONObject token = tokensArray.getJSONObject(i);

                        // Skip tokens not used by any player
                        if (!token.has("user_id") || token.isNull("user_id")) {
                            continue;
                        }

                        String playerId = token.getString("user_id");
                        Player player = getOnlinePlayer(playerId);
                        if (player == null) {
                            continue;
                        }

                        onlinePlayers.add(player);

                        // Assign to team based on game_team_id
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

                results.put(matchId, new MatchTokenData(onlinePlayers, blueTeamPlayers, redTeamPlayers));
            }

        } catch (Exception e) {
            LOGGER.severe("Error batch fetching token data: " + e.getMessage());
            e.printStackTrace();
        }

        return results;
    }

    /**
     * Get an online player by their UUID string.
     */
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

    /**
     * Create match world, teleport players, and register with managers.
     * Uses GameRegistry to create game instances when available.
     * Must be called on the main thread (Bukkit API requirement).
     */
    private void createMatchWorld(String matchId, String matchType, List<Player> blueTeamPlayers,
            List<Player> redTeamPlayers) {
        try {
            LOGGER.info("Creating match world for " + matchId + " (type: " + matchType + ") with " +
                    blueTeamPlayers.size() + " blue players and " +
                    redTeamPlayers.size() + " red players");

            // Create the world first
            String worldName = createWorld(matchId);
            if (worldName == null) {
                LOGGER.severe("Failed to create match world for match " + matchId);
                return;
            }

            World world = Bukkit.getWorld(worldName);
            if (world == null) {
                LOGGER.severe("World " + worldName + " not found after creation");
                return;
            }

            // Check if game type is registered in GameRegistry
            GameRegistry registry = GameRegistry.getInstance();
            if (registry.isRegistered(matchType)) {
                // Use GameRegistry to create and initialize the game
                createGameViaRegistry(matchId, matchType, world, worldName, blueTeamPlayers, redTeamPlayers);
            } else {
                // Legacy fallback for unregistered game types
                LOGGER.info("Game type '" + matchType + "' not registered, using legacy initialization");
                createLegacyMatch(matchId, world, worldName, blueTeamPlayers, redTeamPlayers);
            }

        } catch (Exception e) {
            LOGGER.severe("Error creating match world: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Create a new match world.
     * 
     * @param matchId Match identifier (used for logging)
     * @return World name, or null if creation failed
     */
    private String createWorld(String matchId) {
        // Find the lowest unused world number
        int worldNumber = 1;
        String worldName = "match_" + worldNumber;
        while (Bukkit.getWorld(worldName) != null) {
            worldNumber++;
            worldName = "match_" + worldNumber;
        }

        try {
            WorldCreator creator = new WorldCreator(worldName);
            creator.type(WorldType.FLAT);
            creator.generateStructures(false);

            World world = creator.createWorld();
            if (world == null) {
                LOGGER.severe("Failed to create world: " + worldName);
                return null;
            }

            // Configure world settings
            world.setSpawnLocation(0, 64, 0);
            world.setSpawnFlags(false, false); // No monsters, no animals
            world.setDifficulty(org.bukkit.Difficulty.PEACEFUL);

            LOGGER.info("Created world " + worldName + " for match " + matchId);
            return worldName;

        } catch (Exception e) {
            LOGGER.severe("Error creating world: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Create and initialize a game using GameRegistry.
     * The game handles player setup via its initialize() and start() methods.
     */
    private void createGameViaRegistry(String matchId, String matchType, World world, String worldName,
            List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
        
        GameRegistry registry = GameRegistry.getInstance();
        
        // Create game instance via registry
        BaseGame game = registry.createGame(matchType, plugin, matchId);
        if (game == null) {
            LOGGER.severe("Failed to create game instance for type: " + matchType);
            // Fall back to legacy behavior
            createLegacyMatch(matchId, world, worldName, blueTeamPlayers, redTeamPlayers);
            return;
        }

        // Get arena configuration for this game type
        ArenaConfig arenaConfig = null;
        if (arenaManager != null) {
            arenaConfig = arenaManager.getDefaultArena(matchType);
            if (arenaConfig == null) {
                LOGGER.warning("No arena config found for game type: " + matchType + ", using null config");
            }
        }

        // Initialize the game with world, arena config, and players
        game.initialize(world, arenaConfig, blueTeamPlayers, redTeamPlayers);

        // Collect all players
        List<Player> allPlayers = new ArrayList<>();
        allPlayers.addAll(blueTeamPlayers);
        allPlayers.addAll(redTeamPlayers);

        // Register with match manager (now includes the game instance)
        if (matchManager != null) {
            matchManager.registerMatch(matchId, worldName, allPlayers, game);
        }

        // Register for telemetry
        registerPlayersForTelemetry(matchId, allPlayers.toArray(new Player[0]));

        // Start the game
        game.start();

        LOGGER.info("Game " + matchType + " started for match " + matchId + " via GameRegistry");
    }

    /**
     * Legacy match creation for backward compatibility.
     * Used when game type is not registered in GameRegistry.
     */
    private void createLegacyMatch(String matchId, World world, String worldName,
            List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
        
        // For now, support 1v1 matches in legacy mode
        if (blueTeamPlayers.size() == 1 && redTeamPlayers.size() == 1) {
            Player bluePlayer = blueTeamPlayers.get(0);
            Player redPlayer = redTeamPlayers.get(0);

            // Set both players to survival mode
            bluePlayer.setGameMode(GameMode.SURVIVAL);
            redPlayer.setGameMode(GameMode.SURVIVAL);

            // Teleport players to spawn positions
            Location blueLoc = new Location(world, 5, -61, 0);
            Location redLoc = new Location(world, -5, -61, 0);
            bluePlayer.teleport(blueLoc);
            redPlayer.teleport(redLoc);

            // Clear inventories and reset health/hunger for fair start
            bluePlayer.getInventory().clear();
            redPlayer.getInventory().clear();
            bluePlayer.setHealth(20.0);
            redPlayer.setHealth(20.0);
            bluePlayer.setFoodLevel(20);
            redPlayer.setFoodLevel(20);
            bluePlayer.setSaturation(20.0f);
            redPlayer.setSaturation(20.0f);

            LOGGER.info("Legacy match created between " + bluePlayer.getName() + " and " + redPlayer.getName());

            // Register with match manager (without game instance for legacy)
            if (matchManager != null) {
                matchManager.registerMatch(matchId, worldName, Arrays.asList(bluePlayer, redPlayer));
            }

            // Register for telemetry
            registerPlayersForTelemetry(matchId, bluePlayer, redPlayer);
        } else {
            LOGGER.warning("Legacy mode only supports 1v1 matches. Got " +
                    blueTeamPlayers.size() + " vs " + redTeamPlayers.size() + " players.");
        }
    }

    /**
     * Delete a match world and unload it from memory.
     */
    public static void deleteMatchWorld(String worldName) {
        try {
            World world = Bukkit.getWorld(worldName);
            if (world != null) {
                // Kick all players from the world first
                world.getPlayers().forEach(player -> {
                    World mainWorld = Bukkit.getWorlds().get(0);
                    if (mainWorld != null && !mainWorld.equals(world)) {
                        player.teleport(mainWorld.getSpawnLocation());
                    } else {
                        player.kickPlayer("Match ended. World is being deleted.");
                    }
                });

                // Unload the world
                Bukkit.unloadWorld(world, false);

                // Delete the world folder
                File worldFolder = world.getWorldFolder();
                if (worldFolder.exists()) {
                    deleteDirectory(worldFolder);
                    LOGGER.info("Deleted match world: " + worldName);
                }
            }
        } catch (Exception e) {
            LOGGER.severe("Error deleting match world " + worldName + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Recursively delete a directory.
     */
    private static void deleteDirectory(File directory) {
        if (directory.exists()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        deleteDirectory(file);
                    } else {
                        file.delete();
                    }
                }
            }
            directory.delete();
        }
    }

    private void registerPlayersForTelemetry(String matchId, Player... players) {
        if (!(plugin instanceof ai.blockwarriors.beacon.Plugin)) {
            return;
        }

        ai.blockwarriors.beacon.Plugin pluginInstance = (ai.blockwarriors.beacon.Plugin) plugin;
        MatchTelemetryService telemetry = pluginInstance.getMatchTelemetryService();
        if (telemetry == null) {
            return;
        }

        for (Player player : players) {
            telemetry.registerPlayerInMatch(player.getUniqueId(), matchId);
        }
        LOGGER.info("Registered " + players.length + " players in match " + matchId + " for telemetry");
    }

    // ==================== API Calls ====================

    /**
     * Fetch matches that need processing (Queuing, Waiting, Playing).
     * Single API call.
     */
    private List<JSONObject> fetchMatchesByStatus() {
        ConvexResponseParser.ArrayResult result = convexClient.getArray(
                "/matches", false, "Fetch all matches");

        if (!result.isSuccess()) {
            return new ArrayList<>();
        }

        // Filter to only include actionable statuses
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

    /**
     * Acknowledge a queued match - generates tokens and updates status to Waiting.
     */
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

    /**
     * Check readiness for matches.
     */
    private JSONObject checkReadiness(List<String> matchIds) {
        String matchIdsParam = String.join(",", matchIds);

        ConvexResponseParser.ObjectResult result = convexClient.getObject(
                "/matches/readiness?match_ids=" + matchIdsParam, true,
                "Check readiness for " + matchIds.size() + " matches");

        return result.isSuccess() ? result.getData() : null;
    }

    /**
     * Fetch tokens for matches.
     */
    private JSONObject fetchTokens(List<String> matchIds) {
        String matchIdsParam = String.join(",", matchIds);

        ConvexResponseParser.ObjectResult result = convexClient.getObject(
                "/matches/tokens?match_ids=" + matchIdsParam, true,
                "Fetch tokens for " + matchIds.size() + " matches");

        return result.isSuccess() ? result.getData() : null;
    }

    /**
     * Fetch match info for matches.
     */
    private JSONObject fetchMatches(List<String> matchIds) {
        String matchIdsParam = String.join(",", matchIds);

        ConvexResponseParser.ObjectResult result = convexClient.getObject(
                "/matches/info?match_ids=" + matchIdsParam, true,
                "Fetch " + matchIds.size() + " matches");

        return result.isSuccess() ? result.getData() : null;
    }

    /**
     * Update match status for matches.
     */
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
