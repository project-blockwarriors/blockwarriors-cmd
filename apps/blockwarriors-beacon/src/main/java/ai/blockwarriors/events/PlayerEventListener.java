package ai.blockwarriors.events;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityPickupItemEvent;
import org.bukkit.event.player.*;

import ai.blockwarriors.commands.LoginCommand;
import ai.blockwarriors.beacon.Plugin;

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

        // Remove the player from the logged-in set
        loggedInPlayers.remove(playerId);

        // Remove player from login command
        loginCommand.removeLoggedInPlayer(playerId);

        // Check if player was in an active match and handle match ending
        Plugin plugin = (Plugin) org.bukkit.Bukkit.getPluginManager().getPlugin("beacon");
        if (plugin != null) {
            // Check if player was in a match
            if (plugin.getMatchManager() != null && plugin.getMatchManager().isPlayerInMatch(playerId)) {
                String matchId = plugin.getMatchManager().getMatchIdForPlayer(playerId);
                if (matchId != null) {
                    LOGGER.info("Player " + player.getName() + " quit during match " + matchId);
                    
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

    // Add more event handlers as needed to cover all relevant player events
}