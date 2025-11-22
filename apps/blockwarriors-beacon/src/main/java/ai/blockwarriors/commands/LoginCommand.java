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
import java.util.Set;
import java.util.UUID;
import java.util.logging.Logger;

import org.json.JSONObject;
import org.json.JSONException;

public class LoginCommand implements CommandExecutor {

    private final Set<UUID> loggedInPlayers;
    private final String convexSiteUrl;
    private static final Logger LOGGER = Logger.getLogger("beacon");


    public LoginCommand(Set<UUID> loggedInPlayersInput, String convexSiteUrl) {
        loggedInPlayers = loggedInPlayersInput;
        this.convexSiteUrl = convexSiteUrl;
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
        LOGGER.info("Player " + player.getName() + " attempting login with token (length: " + token.length() + ")");
        
        // Run login asynchronously to avoid blocking the main thread
        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    // Prepare login request
                    String urlString = convexSiteUrl + "/login";
                    URL url = new URL(urlString);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setDoOutput(true);

                    JSONObject requestBody = new JSONObject();
                    // Tokens are pure UUIDs without prefix - use as-is
                    // If token starts with "token", remove that prefix (for backwards compatibility)
                    String tokenToSend = token.startsWith("token") ? token.substring(5) : token;
                    LOGGER.info("Sending token to Convex (length: " + tokenToSend.length() + ", starts with 'token': " + token.startsWith("token") + ")");
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
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8)
                        );
                    } else {
                        reader = new BufferedReader(
                            new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8)
                        );
                    }
                    
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    JSONObject responseJson = new JSONObject(response.toString());
                    String status = responseJson.getString("status");

                    // Handle response on main thread
                    new BukkitRunnable() {
                        @Override
                        public void run() {
                            if (status.equals("ok")) {
                                LOGGER.info("Successfully logged in player " + player.getName());
                                player.sendMessage("Successfully logged in.");
                                loggedInPlayers.add(player.getUniqueId());
                            } else {
                                String error = responseJson.optString("error", "Invalid token");
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

    public void closeSocketandRemoveLoggedIn(UUID playerUUID) {
        loggedInPlayers.remove(playerUUID);
    }
}
