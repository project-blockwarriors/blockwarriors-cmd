package ai.blockwarriors.events;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityPickupItemEvent;
import org.bukkit.event.player.*;

import ai.blockwarriors.commands.LoginCommand;
import ai.blockwarriors.beacon.Plugin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.logging.Logger;
import java.util.Set;
import java.util.UUID;

public class PlayerEventListener implements Listener {
    private final Set<UUID> loggedInPlayers;
    private final Set<UUID> bypassedPlayers;
    private Logger LOGGER = Logger.getLogger("beacon");
    private LoginCommand loginCommand;

    public PlayerEventListener(Set<UUID> loggedInPlayers, Set<UUID> bypassedPlayers, LoginCommand loginCommand) {
        this.loggedInPlayers = loggedInPlayers;
        this.bypassedPlayers = bypassedPlayers;
        this.loginCommand = loginCommand;
    }

    /**
     * Check if player is allowed to play (logged in or bypassed)
     */
    private boolean isPlayerAllowed(UUID playerId) {
        return loggedInPlayers.contains(playerId) || bypassedPlayers.contains(playerId);
    }

    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event) {
        if (!isPlayerAllowed(event.getPlayer().getUniqueId())) {
            event.getPlayer().sendMessage("Please do /login <token> to login first.");
            event.setCancelled(true);
        }
    }

    @EventHandler
    public void onPlayerInteract(PlayerInteractEvent event) {
        if (!isPlayerAllowed(event.getPlayer().getUniqueId())) {
            event.getPlayer().sendMessage("Please do /login <token> to login first.");
            event.setCancelled(true);
        }
    }

    @EventHandler
    public void onPlayerChat(AsyncPlayerChatEvent event) {
        if (!isPlayerAllowed(event.getPlayer().getUniqueId())) {
            if (event.getMessage().startsWith("/login") || event.getMessage().startsWith("/re")) {
                LOGGER.info("Logging in...");
                event.getPlayer().sendMessage("Logging in...");
                return;
            }
            event.getPlayer().sendMessage("Please do /login <token> to login first.");
            LOGGER.info("Cancel chat event");
            event.setCancelled(true);
        }
    }

    @EventHandler
    public void onPlayerCommandPreprocess(PlayerCommandPreprocessEvent event) {
        if (!isPlayerAllowed(event.getPlayer().getUniqueId())) {
            if (event.getMessage().startsWith("/login") || event.getMessage().startsWith("/re")) {
                LOGGER.info("Logging in...");
                event.getPlayer().sendMessage("Logging in...");
                return;
            }
            event.getPlayer().sendMessage("Please do /login <token> to login first.");
            LOGGER.info("Cancel chat event");
            event.setCancelled(true);
        }
    }

    @EventHandler
    public void onPlayerDropItem(PlayerDropItemEvent event) {
        if (!isPlayerAllowed(event.getPlayer().getUniqueId())) {
            event.getPlayer().sendMessage("Please do /login <token> to login first.");
            event.setCancelled(true);
        }
    }

    @EventHandler
    public void onPlayerPickupItem(EntityPickupItemEvent event) {
        if (event.getEntity() instanceof Player) {
            Player player = (Player) event.getEntity();
            if (!isPlayerAllowed(player.getUniqueId())) {
                player.sendMessage("Please do /login <token> to login first.");
                event.setCancelled(true);
            }
        }
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();

        // Get the match ID BEFORE removing from login command (we need it for token clearing)
        String matchIdFromLogin = loginCommand.getMatchIdForPlayer(playerId);

        // Remove the player from the logged-in set
        loggedInPlayers.remove(playerId);

        // Remove player from login command (this also clears the matchId mapping)
        loginCommand.removeLoggedInPlayer(playerId);

        // Check if player was in an active match and handle match ending
        Plugin plugin = (Plugin) org.bukkit.Bukkit.getPluginManager().getPlugin("beacon");
        if (plugin != null) {
            // First, try to clear the token if player was logged in with a match
            // This handles the "Waiting" status case (player logged in but match not started)
            if (matchIdFromLogin != null) {
                LOGGER.info("Player " + player.getName() + " quit, was logged into match " + matchIdFromLogin);
                clearPlayerToken(plugin, playerId.toString(), matchIdFromLogin);
            }
            
            // Check if player was in an active match (match already started)
            if (plugin.getMatchManager() != null && plugin.getMatchManager().isPlayerInMatch(playerId)) {
                String matchId = plugin.getMatchManager().getMatchIdForPlayer(playerId);
                if (matchId != null) {
                    LOGGER.info("Player " + player.getName() + " quit during active match " + matchId);
                    
                    // Find the remaining player (winner)
                    UUID winnerId = null;
                    for (UUID otherPlayerId : plugin.getMatchManager().getPlayersInMatch(matchId)) {
                        if (!otherPlayerId.equals(playerId)) {
                            Player winner = org.bukkit.Bukkit.getPlayer(otherPlayerId);
                            if (winner != null && winner.isOnline()) {
                                winnerId = otherPlayerId;
                                winner.sendMessage("§aYou won the match! " + player.getName() + " has disconnected.");
                                break;
                            }
                        }
                    }
                    
                    // End the match with the remaining player as winner
                    // Pass the quitting player's UUID as the "dead player" for final state
                    plugin.getMatchManager().endMatch(matchId, winnerId != null ? winnerId.toString() : null, playerId);
                }
            }
            
            // Unregister player from match telemetry
            if (plugin.getMatchTelemetryService() != null) {
                plugin.getMatchTelemetryService().unregisterPlayer(playerId);
            }
        }
    }
    
    /**
     * Call Convex API to clear the player's token.
     * Only succeeds if match is in "Waiting" status - Convex handles the status check.
     * This allows the token to be reused if the player disconnects before match starts.
     */
    private void clearPlayerToken(Plugin plugin, String playerId, String matchId) {
        String convexSiteUrl = plugin.getConvexSiteUrl();
        String convexHttpSecret = plugin.getConvexHttpSecret();
        
        if (convexSiteUrl == null || convexHttpSecret == null) {
            LOGGER.warning("Cannot clear token: Convex configuration not available");
            return;
        }
        
        // Run async to avoid blocking main thread
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                String urlString = convexSiteUrl + "/tokens/clear";
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + convexHttpSecret);
                conn.setDoOutput(true);

                JSONObject requestBody = new JSONObject();
                requestBody.put("player_id", playerId);
                requestBody.put("match_id", matchId);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    // Parse response to check if token was actually cleared
                    JSONObject result = new JSONObject(response.toString());
                    if (result.optBoolean("success", false)) {
                        JSONObject data = result.optJSONObject("data");
                        if (data != null && data.optBoolean("success", false)) {
                            LOGGER.info("Cleared token for player " + playerId + " in match " + matchId);
                        } else {
                            // Token not cleared (likely match not in "Waiting" status) - this is expected
                            String error = data != null ? data.optString("error", "") : "";
                            LOGGER.info("Token not cleared for player " + playerId + ": " + error);
                        }
                    }
                } else {
                    LOGGER.warning("Failed to clear token: HTTP " + responseCode);
                }
            } catch (Exception e) {
                LOGGER.warning("Error clearing token: " + e.getMessage());
            }
        });
    }

    // Add more event handlers as needed to cover all relevant player events
}