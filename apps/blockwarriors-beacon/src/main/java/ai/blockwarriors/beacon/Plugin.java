package ai.blockwarriors.beacon;

import java.util.logging.Logger;
import ai.blockwarriors.beacon.service.SocketService;

import java.net.URI;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.WorldType;
import org.bukkit.command.CommandExecutor;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.onarandombox.MultiverseCore.MultiverseCore;
import com.onarandombox.MultiverseCore.api.MVWorldManager;

//import ai.blockwarriors.commands.*;
import ai.blockwarriors.commands.LoginCommand;
import ai.blockwarriors.commands.debug.CreateMatchCommand;
import ai.blockwarriors.commands.debug.ListLoggedInCommand;
import ai.blockwarriors.events.PlayerEventListener;
import ai.blockwarriors.beacon.service.MatchPollingService;
import ai.blockwarriors.beacon.service.MatchTelemetryService;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

/*
 * beacon java plugin
 */
public class Plugin extends JavaPlugin {
    private static final Logger LOGGER = Logger.getLogger("beacon");
    private SocketService socketService;
    private LoginCommand loginCommand;
    // private CreateMatchCommand createMatchCommand;
    // private ListLoggedInCommand listLoggedInCommand;
    private Set<UUID> loggedInPlayers = new HashSet<>();
    private Socket serverSocket;
    private String socketUri = "http://100.112.84.22:3001";
    private MatchPollingService matchPollingService;
    private MatchTelemetryService matchTelemetryService;
    private String convexSiteUrl = "https://abundant-ferret-667.convex.site";

    public MatchTelemetryService getMatchTelemetryService() {
        return matchTelemetryService;
    }

    @Override
    public void onEnable() {
        LOGGER.info("beacon enabled");
        // Initialize Socket.IO connection
        String socketUrl = System.getenv().getOrDefault("SOCKET_URL", socketUri);
        try {
            IO.Options options = IO.Options.builder().setForceNew(false).build();
            serverSocket = IO.socket(socketUrl, options); // main namespace
            registerServerSocketListeners(serverSocket);
            serverSocket.connect();

            LOGGER.info("Socket.IO service initialized with URL: " + socketUrl);
        } catch (Exception e) {
            LOGGER.severe("Failed to connect to Socket.IO service: " + e.getMessage());
        }

        loginCommand = new LoginCommand(loggedInPlayers, socketUri);
        // Register command executors
        registerCommand("login", loginCommand);
        registerCommand("creatematch", new CreateMatchCommand());
        registerCommand("listloggedin", new ListLoggedInCommand(loggedInPlayers));
        // Register the player event listener
        getServer().getPluginManager().registerEvents(new PlayerEventListener(loggedInPlayers, loginCommand), this);
        
        // Initialize and start match polling service
        String convexUrl = System.getenv().getOrDefault("CONVEX_SITE_URL", convexSiteUrl);
        matchPollingService = new MatchPollingService(this, convexUrl, serverSocket);
        matchPollingService.start();
        LOGGER.info("MatchPollingService started with Convex URL: " + convexUrl);
        
        // Initialize and start match telemetry service
        matchTelemetryService = new MatchTelemetryService(this, convexUrl);
        matchTelemetryService.start();
        LOGGER.info("MatchTelemetryService started");
    }
    
    private void registerServerSocketListeners(Socket serverSocket) {
        // Connect & Disconnect
        LOGGER.info("Registering serverSocket listeners");
        serverSocket.on(Socket.EVENT_CONNECT, args -> {
            LOGGER.info("Connected to Socket.IO (main) service");
        });

        serverSocket.on("hello", args -> {
            LOGGER.info("Received hello event from Socket.IO (main) service");
            // Handle the hello event here
        });

        serverSocket.on(Socket.EVENT_DISCONNECT, args -> {
            LOGGER.info("Disconnected from Socket.IO (main) service");
        });
        
        // make serverSocket listen to n emit
        // serverSocket.on("eventName", args -> {


        // game start logic (fix up json datatype)
        serverSocket.on("startMatch", args -> {
                Player player1 = null;
            Player player2 = null;
                LOGGER.info("Received startMatch event");
                JSONObject data = (JSONObject) args[0];
                LOGGER.info("Received startMatch event with data: " + data.toString());
                // The object is of the form
                // {
                // matchType: "pvp",
                // playersPerTeam: 1,
                // blue_team: team1, // list of {playerId: "uuid"} objects
                // red_team: team2, // list of {playerId: "uuid"} objects
                // matchId: "match_id" // optional match ID
                // }
                // where team1 and team2 are lists of player objects

                try {
                int playersPerTeam = data.getInt("playersPerTeam");
                    LOGGER.info("Players per team: " + playersPerTeam);
                String matchType = data.getString("matchType");
                    LOGGER.info("Match type: " + matchType);
                String matchId = data.optString("matchId", null);
                JSONArray blueTeam = data.getJSONArray("blue_team");
                    LOGGER.info("Blue team: " + blueTeam.toString());
                JSONArray redTeam = data.getJSONArray("red_team");
                    LOGGER.info("Red team: " + redTeam.toString());
                    
                    Set<UUID> allPlayerIds = new HashSet<>();
                    
                    // Process the teams
                    for (int i = 0; i < blueTeam.length(); i++) {
                    JSONObject player = blueTeam.getJSONObject(i);
                        
                        UUID playerId = UUID.fromString(player.getString("playerId"));
                        allPlayerIds.add(playerId);
                        // Do something with the playerId

                        player1 = getServer().getPlayer(playerId);
                        LOGGER.info("Blue team player ID: " + playerId);
                    }
                    for (int i = 0; i < redTeam.length(); i++) {
                        JSONObject player = redTeam.getJSONObject(i);
                        UUID playerId = UUID.fromString(player.getString("playerId"));
                        allPlayerIds.add(playerId);
                        // Do something with the playerId

                        player2 = getServer().getPlayer(playerId);
                        LOGGER.info("Red team player ID: " + playerId);
                    }

                    LOGGER.info("Match type: " + matchType);
                    LOGGER.info("Players per team: " + playersPerTeam);

                    if (player1 != null && player2 != null) {
                        // Create match
                        CreateMatchCommand.createMatch(player1, player2);
                        LOGGER.info("Match created between " + player1.getName() + " and " + player2.getName());
                        
                        // Register players in telemetry service if matchId is provided
                        if (matchId != null && matchTelemetryService != null) {
                            for (UUID playerId : allPlayerIds) {
                                matchTelemetryService.registerPlayerInMatch(playerId, matchId);
                            }
                            LOGGER.info("Registered " + allPlayerIds.size() + " players in match " + matchId + " for telemetry");
                        }
                    } else {
                        LOGGER.warning("One or both players are not online.");
                        // get players using uuid Bukkit.getOfflinePlayer(playerUUID).getName();
                        // this data needs to be passed in via the socket (should be part of the user
                        // account)
                    }
                } catch (JSONException e) {
                LOGGER.severe("Failed to parse startGame data: " + e.getMessage());
                LOGGER.severe(e.getStackTrace().toString());
                }
            }

        );

        serverSocket.on("startGame", new Emitter.Listener() {
                @Override
            public void call(Object... args) {
                // The object is of the form
                // {
                // matchType: "pvp",
                // playersPerTeam: 1,
                // blue_team: team1, // list of {playerId: "uuid"} objects
                // red_team: team2, // list of {playerId: "uuid"} objects
                // }
                // where team1 and team2 are lists of player objects

                // Example JSON structure:
                // Code to get playersPerTeam in Java from the above object
                

                
                if (args.length > 0 && args[0] instanceof JSONObject) {
                    JSONObject data = (JSONObject) args[0];
                    try {
                        JSONArray teams = data.getJSONArray("teams");
                        // Ideally get code and switch case the statement, right now only support is for pvp (1v1)
                        if (teams.length() == 2) {
                            JSONObject team1 = teams.getJSONObject(0);
                            JSONObject team2 = teams.getJSONObject(1);

                            UUID player1Id = UUID.fromString(team1.getString("playerId"));
                            UUID player2Id = UUID.fromString(team2.getString("playerId"));

                            Player player1 = getServer().getPlayer(player1Id);
                            Player player2 = getServer().getPlayer(player2Id);

                                if (player1 != null && player2 != null) {
                                    CreateMatchCommand.createMatch(player1, player2);
                                    LOGGER.info("Match created between " + player1.getName() + " and " + player2.getName());
                                } else {
                                    LOGGER.warning("One or both players are not online.");
                                    // get players using uuid Bukkit.getOfflinePlayer(playerUUID).getName();
                                // this data needs to be passed in via the socket (should be part of the user account)
                                    
                                    
                                }
                            } else {
                                LOGGER.warning("Invalid team structure received.");
                            }
                        } catch (JSONException e) {
                            LOGGER.severe("Failed to parse startGame data: " + e.getMessage());
                        }
                    } else {
                        LOGGER.warning("Invalid data received for startGame event.");
                    }
                }
            });


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
        if (socketService != null) {
            socketService.disconnect();
        }
        LOGGER.info("beacon disabled");

        if (loginCommand != null) {
            for (UUID playerUUID : loginCommand.getPlayerSockets().keySet()) {
                loginCommand.closeSocketandRemoveLoggedIn(playerUUID);
            }
        }

        if (serverSocket != null && serverSocket.connected()) {
            serverSocket.disconnect();
            serverSocket.close();
        }

        // Stop match polling service
        if (matchPollingService != null) {
            matchPollingService.stop();
        }

        // Stop match telemetry service
        if (matchTelemetryService != null) {
            matchTelemetryService.stop();
        }

        LOGGER.info("closed main server socket ");
    }
}
