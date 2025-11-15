package ai.blockwarriors.commands;

import io.socket.client.Ack;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.logging.Logger;

import org.json.JSONObject;
import org.json.JSONException;

public class LoginCommand implements CommandExecutor {

    private final Map<UUID, Socket> playerSockets = new HashMap<>();
    private final Set<UUID> loggedInPlayers;
    private final String socketUriBase;
    private static final Logger LOGGER = Logger.getLogger("beacon");


    public LoginCommand(Set<UUID> loggedInPlayersInput, String socketUriBase) {
        loggedInPlayers = loggedInPlayersInput;
        this.socketUriBase = socketUriBase;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            return false; // Exit condition if sender is not a player
        }

        // Exit if the player is already logged in
        if (loggedInPlayers.contains(((Player) sender).getUniqueId())) {
            ((Player) sender).sendMessage("You are already logged in.");
            return true;
        }

        Logger logger = Bukkit.getLogger();
        Player player = (Player) sender;

        if (args.length != 1) {
            player.sendMessage("Usage: /login <token>");
            return false;
        }

        String token = args[0];
        System.out.println("Token: " + token);
        try {

            IO.Options options = IO.Options.builder().setForceNew(false).build();
            Socket playerSocket = IO.socket(URI.create(socketUriBase + "/player"), options); // the "player" namespace
            registerPlayerSocketListeners(player, playerSocket);

            JSONObject playerValidationObject = new JSONObject();
            playerValidationObject.put("playerId", player.getUniqueId());
            playerValidationObject.put("token", token.substring(5));

            playerSocket.emit("login", playerValidationObject, (Ack) returned -> {
                JSONObject response = (JSONObject) returned[0];
                try {
                    System.out.println(response.getString("status"));
                    if (response.getString("status").equals("ok")) {
                        logger.info("Successfully logged in. with status ok");
                        player.sendMessage("Successfully logged in.");
                        loggedInPlayers.add(player.getUniqueId()); // Add player to logged-in set
                    } else {
                        logger.info("Failed to log in: invalid token provided " + token);
                        player.sendMessage("Failed to log in: invalid token provided " + token);
                        player.kickPlayer("Failed to log in: invalid token provided " + token);
                        closeSocketandRemoveLoggedIn(player.getUniqueId());
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }); 

            playerSocket.connect();
            playerSockets.put(player.getUniqueId(), playerSocket);
            // End, success
        } catch (JSONException e1) {
            e1.printStackTrace();
            return false;
        } finally {
            System.out.println("Command /login has been run");
        }
        return true;
    }

    public void closeSocketandRemoveLoggedIn(UUID playerUUID) {
        Socket socket = playerSockets.get(playerUUID);
        if (socket != null && socket.connected()) {
            socket.disconnect();
            socket.close();
            loggedInPlayers.remove(playerUUID);
            playerSockets.remove(playerUUID);
        }
    }

    public Map<UUID, Socket> getPlayerSockets() {
        return playerSockets;
    }


    private void registerPlayerSocketListeners(Player player, Socket playerSocket) {
        LOGGER.info("Registering playerSocket listeners on player: " + player.getName());
        playerSocket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                System.out.println("SocketIO connection established with token.");
                player.sendMessage("SocketIO connection established with token.");
            }
        }).on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("beacon"),
                        new Runnable() {
                            @Override
                            public void run() {
                                System.out.println("SocketIO connection failed or disconnected. (on disconnect)");
                                player.kickPlayer("Socket-IO Connection DISCONNECTED"); // "SocketIO connection failed
                                                                                        // or disconnected.");
                                closeSocketandRemoveLoggedIn(player.getUniqueId());
                            }
                        });

            }
        });

        // player joined match (in same room)
        playerSocket.on("playerJoined", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                JSONObject playerId = (JSONObject) args[0];
                try {
                    UUID playerUUID = UUID.fromString(playerId.getString("playerId"));
                    String playerName = Bukkit.getPlayer(playerUUID).getName();
                    player.sendMessage("Player " + playerName + " has joined the match.");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        // player left match (in same room)
        playerSocket.on("playerLeft", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                JSONObject playerId = (JSONObject) args[0];
                try {
                    UUID playerUUID = UUID.fromString(playerId.getString("playerId"));
                    String playerName = Bukkit.getOfflinePlayer(playerUUID).getName();
                    player.sendMessage("Player " + playerName + " has left the match.");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        // Add more event listeners as needed
    }
}
