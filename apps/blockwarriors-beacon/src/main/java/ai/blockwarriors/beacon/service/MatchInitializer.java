package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.ArenaManager;
import ai.blockwarriors.beacon.game.BaseGame;
import ai.blockwarriors.beacon.game.GameRegistry;

import java.util.*;
import java.util.logging.Logger;

/**
 * Handles match initialization: world creation, game instantiation,
 * player teleportation, and registration with MatchManager.
 *
 * All games MUST be registered in GameRegistry — no legacy fallback.
 */
public class MatchInitializer {
    private static final Logger LOGGER = Logger.getLogger("beacon");

    private final JavaPlugin plugin;
    private final MatchWorldManager worldManager;
    private MatchManager matchManager;
    private ArenaManager arenaManager;

    public MatchInitializer(JavaPlugin plugin) {
        this.plugin = plugin;
        this.worldManager = new MatchWorldManager();
    }

    public void setMatchManager(MatchManager matchManager) {
        this.matchManager = matchManager;
    }

    public void setArenaManager(ArenaManager arenaManager) {
        this.arenaManager = arenaManager;
    }

    /**
     * Container for all token-related data needed to start a match.
     */
    public static class MatchTokenData {
        public final List<Player> onlinePlayers;
        public final List<Player> blueTeamPlayers;
        public final List<Player> redTeamPlayers;

        public MatchTokenData(List<Player> onlinePlayers, List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
            this.onlinePlayers = onlinePlayers;
            this.blueTeamPlayers = blueTeamPlayers;
            this.redTeamPlayers = redTeamPlayers;
        }

        public boolean hasPlayers() {
            return !onlinePlayers.isEmpty();
        }

        public boolean hasValidTeams() {
            return !blueTeamPlayers.isEmpty() && !redTeamPlayers.isEmpty();
        }
    }

    /**
     * Initiate match start with pre-fetched token data.
     * Validates player availability and schedules world creation on the main thread.
     */
    public void initiateMatchStart(String matchId, String matchType, MatchTokenData tokenData) {
        if (!tokenData.hasPlayers()) {
            LOGGER.warning("Cannot start match " + matchId + ": no online players found");
            return;
        }

        if (!tokenData.hasValidTeams()) {
            LOGGER.warning("Cannot start match " + matchId + ": missing players on one or both teams");
            return;
        }

        // Create match world on main thread (Bukkit API requirement)
        Bukkit.getScheduler().runTask(plugin, () -> {
            createAndStartMatch(matchId, matchType, tokenData.blueTeamPlayers, tokenData.redTeamPlayers);
        });
    }

    /**
     * Create world, instantiate game, register match, and start.
     * Must be called on the main thread.
     */
    private void createAndStartMatch(String matchId, String matchType,
                                      List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
        try {
            LOGGER.info("Creating match world for " + matchId + " (type: " + matchType + ") with " +
                    blueTeamPlayers.size() + " blue players and " +
                    redTeamPlayers.size() + " red players");

            String worldName = worldManager.createWorld(matchId);
            if (worldName == null) {
                LOGGER.severe("Failed to create match world for match " + matchId);
                return;
            }

            World world = Bukkit.getWorld(worldName);
            if (world == null) {
                LOGGER.severe("World " + worldName + " not found after creation");
                return;
            }

            GameRegistry registry = GameRegistry.getInstance();
            if (!registry.isRegistered(matchType)) {
                LOGGER.severe("Game type '" + matchType + "' is not registered in GameRegistry. " +
                        "All game types must be registered — no legacy fallback.");
                MatchWorldManager.deleteWorld(worldName);
                return;
            }

            BaseGame game = registry.createGame(matchType, plugin, matchId);
            if (game == null) {
                LOGGER.severe("Failed to create game instance for type: " + matchType);
                MatchWorldManager.deleteWorld(worldName);
                return;
            }

            // Get arena configuration
            ArenaConfig arenaConfig = null;
            if (arenaManager != null) {
                arenaConfig = arenaManager.getDefaultArena(matchType);
                if (arenaConfig == null) {
                    LOGGER.warning("No arena config found for game type: " + matchType + ", using null config");
                }
            }

            // Initialize the game
            game.initialize(world, arenaConfig, blueTeamPlayers, redTeamPlayers);

            // Register with match manager
            List<Player> allPlayers = new ArrayList<>();
            allPlayers.addAll(blueTeamPlayers);
            allPlayers.addAll(redTeamPlayers);

            if (matchManager != null) {
                matchManager.registerMatch(matchId, worldName, allPlayers, game);
            }

            // Register for telemetry
            registerPlayersForTelemetry(matchId, allPlayers.toArray(new Player[0]));

            // Start the game
            game.start();

            LOGGER.info("Game " + matchType + " started for match " + matchId + " via GameRegistry");

        } catch (Exception e) {
            LOGGER.severe("Error creating match world: " + e.getMessage());
            e.printStackTrace();
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
}
