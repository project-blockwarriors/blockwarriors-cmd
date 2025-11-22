package ai.blockwarriors.beacon;

import java.util.logging.Logger;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.bukkit.command.CommandExecutor;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import ai.blockwarriors.commands.LoginCommand;
import ai.blockwarriors.commands.debug.CreateMatchCommand;
import ai.blockwarriors.commands.debug.ListLoggedInCommand;
import ai.blockwarriors.events.PlayerEventListener;
import ai.blockwarriors.beacon.service.MatchPollingService;
import ai.blockwarriors.beacon.service.MatchTelemetryService;

/*
 * beacon java plugin
 */
public class Plugin extends JavaPlugin {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private LoginCommand loginCommand;
    private Set<UUID> loggedInPlayers = new HashSet<>();
    private MatchPollingService matchPollingService;
    private MatchTelemetryService matchTelemetryService;
    private String convexSiteUrl = "https://abundant-ferret-667.convex.site";

    public MatchTelemetryService getMatchTelemetryService() {
        return matchTelemetryService;
    }

    @Override
    public void onEnable() {
        LOGGER.info("beacon enabled");
        
        // Initialize Convex URL
        String convexUrl = System.getenv().getOrDefault("CONVEX_SITE_URL", convexSiteUrl);
        
        // Initialize login command with Convex URL
        loginCommand = new LoginCommand(loggedInPlayers, convexUrl);
        
        // Register command executors
        registerCommand("login", loginCommand);
        registerCommand("creatematch", new CreateMatchCommand());
        registerCommand("listloggedin", new ListLoggedInCommand(loggedInPlayers));
        
        // Register the player event listener
        getServer().getPluginManager().registerEvents(new PlayerEventListener(loggedInPlayers, loginCommand), this);
        
        // Initialize and start match polling service
        matchPollingService = new MatchPollingService(this, convexUrl);
        matchPollingService.start();
        LOGGER.info("MatchPollingService started with Convex URL: " + convexUrl);
        
        // Initialize and start match telemetry service
        matchTelemetryService = new MatchTelemetryService(this, convexUrl);
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

        LOGGER.info("beacon plugin disabled");
    }
}
