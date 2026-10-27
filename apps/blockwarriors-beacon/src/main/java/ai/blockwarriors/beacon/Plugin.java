package ai.blockwarriors.beacon;

import java.util.logging.Logger;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.bukkit.command.CommandExecutor;
import org.bukkit.plugin.java.JavaPlugin;

import ai.blockwarriors.commands.LoginCommand;
import ai.blockwarriors.commands.debug.CreateMatchCommand;
import ai.blockwarriors.commands.debug.EndGameCommand;
import ai.blockwarriors.commands.debug.ListLoggedInCommand;
import ai.blockwarriors.commands.debug.SetArenaCommand;
import ai.blockwarriors.commands.debug.SimulateDisconnectCommand;
import ai.blockwarriors.commands.debug.SimulateReconnectCommand;
import ai.blockwarriors.commands.debug.TestGameCommand;
import ai.blockwarriors.commands.debug.TriggerObjectiveCommand;
import ai.blockwarriors.events.PlayerEventListener;
import ai.blockwarriors.beacon.arena.ArenaManager;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.GameRegistry;
import ai.blockwarriors.beacon.game.impl.BridgeGame;
import ai.blockwarriors.beacon.game.impl.BuildUHCGame;
import ai.blockwarriors.beacon.game.impl.CTFGame;
import ai.blockwarriors.beacon.game.impl.PvPGame;
import ai.blockwarriors.beacon.service.MatchPollingService;
import ai.blockwarriors.beacon.service.MatchTelemetryService;
import ai.blockwarriors.beacon.service.MatchManager;

/*
 * beacon java plugin
 */
public class Plugin extends JavaPlugin {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private LoginCommand loginCommand;
    private Set<UUID> loggedInPlayers = new HashSet<>();
    private Set<UUID> bypassedPlayers = new HashSet<>(); // Operators who bypass login
    private MatchPollingService matchPollingService;
    private MatchTelemetryService matchTelemetryService;
    private MatchManager matchManager;
    private ArenaManager arenaManager;
    private String convexSiteUrl;
    private String convexHttpSecret;

    public Set<UUID> getBypassedPlayers() {
        return bypassedPlayers;
    }

    public MatchTelemetryService getMatchTelemetryService() {
        return matchTelemetryService;
    }

    public MatchManager getMatchManager() {
        return matchManager;
    }

    public ArenaManager getArenaManager() {
        return arenaManager;
    }

    public String getConvexSiteUrl() {
        return convexSiteUrl;
    }

    public String getConvexHttpSecret() {
        return convexHttpSecret;
    }

    @Override
    public void onEnable() {
        LOGGER.info("beacon enabled");

        // Save default config if it doesn't exist
        saveDefaultConfig();

        // Load Convex configuration from config.yml
        convexSiteUrl = getConfig().getString("convex-site-url", "https://abundant-ferret-667.convex.site");
        convexHttpSecret = getConfig().getString("convex-http-secret", "");

        // Allow environment variable override (useful for development)
        convexSiteUrl = System.getenv().getOrDefault("CONVEX_SITE_URL", convexSiteUrl);
        convexHttpSecret = System.getenv().getOrDefault("CONVEX_HTTP_SECRET", convexHttpSecret);

        if (convexHttpSecret.isEmpty() || convexHttpSecret.equals("your-secret-here")) {
            LOGGER.warning("CONVEX_HTTP_SECRET is not configured! Please set it in config.yml or as an environment variable.");
        }

        // Initialize arena manager and load arena configurations
        arenaManager = new ArenaManager(this);
        arenaManager.loadArenas();
        LOGGER.info("ArenaManager initialized with " + arenaManager.getArenaCount() + " arenas");

        // Initialize match manager
        matchManager = new MatchManager(this, convexSiteUrl, convexHttpSecret);

        // Initialize match telemetry service
        matchTelemetryService = new MatchTelemetryService(this, convexSiteUrl, convexHttpSecret);

        // Link telemetry service and match manager bidirectionally
        matchManager.setTelemetryService(matchTelemetryService);
        matchTelemetryService.setMatchManager(matchManager);

        // Initialize GameRegistry and register game types
        GameRegistry registry = GameRegistry.getInstance();
        
        // Register PvP game type with metadata
        registry.registerGame(
            GameConfig.GAME_TYPE_PVP,
            PvPGame::new,
            GameRegistry.GameMetadata.builder()
                .displayName("Normal PvP")
                .description("Classic 1v1 player versus player combat")
                .playersPerTeam(1)
                .teamCount(2)
                .defaultArena("pvp")
                .build()
        );
        
        // Register Bridge game type
        registry.registerGame(
            GameConfig.GAME_TYPE_BRIDGE,
            BridgeGame::new,
            GameRegistry.GameMetadata.builder()
                .displayName("Bridge Challenge")
                .description("1v1 bridge building — reach the enemy goal zone to score")
                .playersPerTeam(1)
                .teamCount(2)
                .defaultArena("bridge")
                .build()
        );

        // Register CTF game type
        registry.registerGame(
            GameConfig.GAME_TYPE_CTF,
            CTFGame::new,
            GameRegistry.GameMetadata.builder()
                .displayName("Capture the Flag")
                .description("4v4 team-based flag capture")
                .playersPerTeam(4)
                .teamCount(2)
                .defaultArena("ctf")
                .build()
        );

        // Register Build UHC game type
        registry.registerGame(
            GameConfig.GAME_TYPE_BUILD_UHC,
            BuildUHCGame::new,
            GameRegistry.GameMetadata.builder()
                .displayName("Build UHC")
                .description("1v1 duel with building, bow, melee, and healing")
                .playersPerTeam(1)
                .teamCount(2)
                .defaultArena("build_uhc")
                .build()
        );

        LOGGER.info("GameRegistry initialized. Registered game types: " +
                   registry.getRegisteredTypes());

        // Initialize login command with Convex URL and secret
        loginCommand = new LoginCommand(loggedInPlayers, convexSiteUrl, convexHttpSecret);

        // Register command executors
        registerCommand("login", loginCommand);
        registerCommand("creatematch", new CreateMatchCommand());
        registerCommand("listloggedin", new ListLoggedInCommand(loggedInPlayers));
        registerCommand("bypass", new ai.blockwarriors.commands.BypassCommand(bypassedPlayers));
        
        // Register debug commands
        TestGameCommand testGameCommand = new TestGameCommand(this);
        registerCommand("testgame", testGameCommand);
        if (getCommand("testgame") != null) {
            getCommand("testgame").setTabCompleter(testGameCommand);
        }
        
        SetArenaCommand setArenaCommand = new SetArenaCommand(this);
        registerCommand("setarena", setArenaCommand);
        if (getCommand("setarena") != null) {
            getCommand("setarena").setTabCompleter(setArenaCommand);
        }
        
        EndGameCommand endGameCommand = new EndGameCommand(this);
        registerCommand("endgame", endGameCommand);
        if (getCommand("endgame") != null) {
            getCommand("endgame").setTabCompleter(endGameCommand);
        }
        
        TriggerObjectiveCommand triggerObjectiveCommand = new TriggerObjectiveCommand(this);
        registerCommand("triggerobjective", triggerObjectiveCommand);
        if (getCommand("triggerobjective") != null) {
            getCommand("triggerobjective").setTabCompleter(triggerObjectiveCommand);
        }
        
        SimulateDisconnectCommand simulateDisconnectCommand = new SimulateDisconnectCommand(this);
        registerCommand("simulatedisconnect", simulateDisconnectCommand);
        if (getCommand("simulatedisconnect") != null) {
            getCommand("simulatedisconnect").setTabCompleter(simulateDisconnectCommand);
        }
        
        SimulateReconnectCommand simulateReconnectCommand = new SimulateReconnectCommand(this);
        registerCommand("simulatereconnect", simulateReconnectCommand);
        if (getCommand("simulatereconnect") != null) {
            getCommand("simulatereconnect").setTabCompleter(simulateReconnectCommand);
        }

        // Register event listeners
        getServer().getPluginManager()
                .registerEvents(new PlayerEventListener(loggedInPlayers, bypassedPlayers, loginCommand), this);
        getServer().getPluginManager().registerEvents(new ai.blockwarriors.events.MatchEventListener(matchManager),
                this);
        getServer().getPluginManager().registerEvents(new ai.blockwarriors.events.WorldEventListener(), this);

        // Initialize and start match polling service
        matchPollingService = new MatchPollingService(this, convexSiteUrl, convexHttpSecret);
        matchPollingService.setMatchManager(matchManager);
        matchPollingService.setArenaManager(arenaManager);
        matchPollingService.start();
        LOGGER.info("MatchPollingService started with Convex URL: " + convexSiteUrl);

        // Start match telemetry service (already initialized above)
        matchTelemetryService.start();
        LOGGER.info("MatchTelemetryService started");
    }

    private void registerCommand(String commandName, CommandExecutor executor) {
        if (getCommand(commandName) != null) {
            LOGGER.info("Registering command '" + commandName + "'");
            getCommand(commandName).setExecutor(executor);
            LOGGER.info("Command '" + commandName + "' registered");
        } else {
            LOGGER.severe("Command '" + commandName + "' not found in plugin.yml");
        }
    }

    @Override
    public void onDisable() {
        LOGGER.info("beacon disabled");

        // Stop match polling service
        if (matchPollingService != null) {
            matchPollingService.stop();
        }

        // Stop match telemetry service
        if (matchTelemetryService != null) {
            matchTelemetryService.stop();
        }

        // Clear GameRegistry
        GameRegistry.getInstance().clearAll();

        LOGGER.info("beacon plugin disabled");
    }
}
