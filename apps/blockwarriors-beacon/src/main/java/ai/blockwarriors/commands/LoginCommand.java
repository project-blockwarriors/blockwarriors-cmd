package ai.blockwarriors.commands;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import org.json.JSONObject;

import ai.blockwarriors.beacon.util.ConvexClient;
import ai.blockwarriors.beacon.util.ConvexResponseParser;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

public class LoginCommand implements CommandExecutor {

    private final Set<UUID> loggedInPlayers;
    private final ConvexClient convexClient;
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    // Track which match each player logged into (for token clearing on disconnect)
    private final Map<UUID, String> playerMatchIds = new ConcurrentHashMap<>();

    public LoginCommand(Set<UUID> loggedInPlayersInput, String convexSiteUrl, String convexHttpSecret) {
        loggedInPlayers = loggedInPlayersInput;
        this.convexClient = new ConvexClient(convexSiteUrl, convexHttpSecret);
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
                JSONObject requestBody = new JSONObject();
                requestBody.put("token", token);
                requestBody.put("playerId", player.getUniqueId().toString());
                requestBody.put("ign", player.getName());

                ConvexResponseParser.ObjectResult result = convexClient.postObject(
                        "/validateToken", requestBody, "Validate token for " + player.getName());

                final boolean success = result.isSuccess();
                final String error = success ? null : result.getError();
                final String matchId = success && result.getData() != null 
                        ? result.getData().optString("matchId", null) 
                        : null;

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
