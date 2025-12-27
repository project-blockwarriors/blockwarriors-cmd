package ai.blockwarriors.commands;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

import org.json.JSONObject;

import ai.blockwarriors.beacon.util.ConvexResponseParser;

public class LoginCommand implements CommandExecutor {

    private final Set<UUID> loggedInPlayers;
    private final String convexSiteUrl;
    private final String convexHttpSecret;
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    // Track which match each player logged into (for token clearing on disconnect)
    private final Map<UUID, String> playerMatchIds = new ConcurrentHashMap<>();

    public LoginCommand(Set<UUID> loggedInPlayersInput, String convexSiteUrl, String convexHttpSecret) {
        loggedInPlayers = loggedInPlayersInput;
        this.convexSiteUrl = convexSiteUrl;
        this.convexHttpSecret = convexHttpSecret;
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

        Player player = (Player) sender;

        if (args.length != 1) {
            player.sendMessage("Usage: /login <token>");
            return false;
        }

        String token = args[0];
        LOGGER.info("Player " + player.getName() + " attempting login with token (length: " + token.length() + ")");

        // Run login asynchronously to avoid blocking the main thread
        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    // Prepare login request
                    String urlString = convexSiteUrl + "/validateToken";
                    URL url = new URL(urlString);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Authorization", "Bearer " + convexHttpSecret);
                    conn.setDoOutput(true);

                    JSONObject requestBody = new JSONObject();
                    // Tokens are pure UUIDs without prefix - use as-is
                    // If token starts with "token", remove that prefix (for backwards
                    // compatibility)
                    String tokenToSend = token.startsWith("token") ? token.substring(5) : token;
                    LOGGER.info("Sending token to Convex (length: " + tokenToSend.length() + ", starts with 'token': "
                            + token.startsWith("token") + ")");
                    requestBody.put("token", tokenToSend);
                    requestBody.put("playerId", player.getUniqueId().toString());
                    requestBody.put("ign", player.getName());

                    try (OutputStream os = conn.getOutputStream()) {
                        byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                        os.write(input, 0, input.length);
                    }

                    int responseCode = conn.getResponseCode();

                    // Read response
                    BufferedReader reader;
                    if (responseCode >= 200 && responseCode < 300) {
                        reader = new BufferedReader(
                                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    } else {
                        reader = new BufferedReader(
                                new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
                    }

                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    // Parse with standardized format using ConvexResponseParser
                    ConvexResponseParser.ObjectResult result = ConvexResponseParser.parseObject(
                        response.toString(), "Validate token for " + player.getName());
                    
                    final boolean success = result.isSuccess();
                    final String error = success ? null : result.getError();
                    final String matchId;
                    
                    if (success) {
                        JSONObject data = result.getData();
                        matchId = data != null ? data.optString("matchId", null) : null;
                    } else {
                        matchId = null;
                    }

                    // Handle response on main thread
                    new BukkitRunnable() {
                        @Override
                        public void run() {
                            if (success) {
                                LOGGER.info("Successfully logged in player " + player.getName() + 
                                    (matchId != null ? " for match " + matchId : ""));
                                player.sendMessage("Successfully logged in.");
                                loggedInPlayers.add(player.getUniqueId());
                                
                                // Track the match this player logged into
                                if (matchId != null) {
                                    playerMatchIds.put(player.getUniqueId(), matchId);
                                }
                            } else {
                                LOGGER.warning("Failed to log in player " + player.getName() + ": " + error);
                                player.sendMessage("Failed to log in: " + error);
                                player.kickPlayer("Failed to log in: " + error);
                            }
                        }
                    }.runTask(Bukkit.getPluginManager().getPlugin("beacon"));

                } catch (Exception e) {
                    LOGGER.severe("Error during login: " + e.getMessage());
                    e.printStackTrace();
                    // Handle error on main thread
                    new BukkitRunnable() {
                        @Override
                        public void run() {
                            player.sendMessage("Error during login. Please try again.");
                        }
                    }.runTask(Bukkit.getPluginManager().getPlugin("beacon"));
                }
            }
        }.runTaskAsynchronously(Bukkit.getPluginManager().getPlugin("beacon"));

        return true;
    }

    public void removeLoggedInPlayer(UUID playerUUID) {
        loggedInPlayers.remove(playerUUID);
        playerMatchIds.remove(playerUUID);
    }
    
    /**
     * Get the match ID that a player logged into.
     * Used for clearing tokens when player disconnects during "Waiting" status.
     */
    public String getMatchIdForPlayer(UUID playerUUID) {
        return playerMatchIds.get(playerUUID);
    }
}
