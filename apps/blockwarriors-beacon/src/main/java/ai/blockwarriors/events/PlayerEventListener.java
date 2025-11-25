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

        // Unregister player from match telemetry if they're in a match
        Plugin plugin = (Plugin) org.bukkit.Bukkit.getPluginManager().getPlugin("beacon");
        if (plugin != null && plugin.getMatchTelemetryService() != null) {
            plugin.getMatchTelemetryService().unregisterPlayer(playerId);
        }
    }

    // Add more event handlers as needed to cover all relevant player events
}