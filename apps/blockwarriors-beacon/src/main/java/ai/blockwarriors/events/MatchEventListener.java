package ai.blockwarriors.events;

import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.player.PlayerItemConsumeEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerKickEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.Inventory;

import ai.blockwarriors.beacon.game.BaseGame;
import ai.blockwarriors.beacon.game.DisconnectReason;
import ai.blockwarriors.beacon.game.DisconnectResult;
import ai.blockwarriors.beacon.game.impl.BuildUHCGame;
import ai.blockwarriors.beacon.game.kit.KitSelectionGUI;
import ai.blockwarriors.beacon.service.MatchManager;

import java.util.logging.Logger;
import java.util.UUID;

/**
 * Handles match-related events: player deaths, disconnects, reconnects, and damage.
 * Delegates all handling to BaseGame instances via MatchManager.
 */
public class MatchEventListener implements Listener {
    private final MatchManager matchManager;
    private static final Logger LOGGER = Logger.getLogger("beacon");

    public MatchEventListener(MatchManager matchManager) {
        this.matchManager = matchManager;
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player deadPlayer = event.getEntity();
        UUID deadPlayerId = deadPlayer.getUniqueId();

        if (!matchManager.isPlayerInMatch(deadPlayerId)) {
            return;
        }

        String matchId = matchManager.getMatchIdForPlayer(deadPlayerId);
        if (matchId == null) {
            return;
        }

        LOGGER.info("Player " + deadPlayer.getName() + " died in match " + matchId);

        Player killer = deadPlayer.getKiller();
        matchManager.delegatePlayerDeath(deadPlayer, killer);
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onEntityDamageByEntity(EntityDamageByEntityEvent event) {
        if (!(event.getDamager() instanceof Player) || !(event.getEntity() instanceof Player)) {
            return;
        }

        Player damager = (Player) event.getDamager();
        Player target = (Player) event.getEntity();
        UUID damagerId = damager.getUniqueId();

        if (!matchManager.isPlayerInMatch(damagerId)) {
            return;
        }

        String matchId = matchManager.getMatchIdForPlayer(damagerId);
        if (matchId == null) {
            return;
        }

        BaseGame game = matchManager.getGameForMatch(matchId);
        if (game != null && game.isActive()) {
            game.handleDamage(damager, target, event.getFinalDamage());
        }
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerQuit(PlayerQuitEvent event) {
        handlePlayerDisconnect(event.getPlayer(), DisconnectReason.QUIT);
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerKick(PlayerKickEvent event) {
        handlePlayerDisconnect(event.getPlayer(), DisconnectReason.KICK);
    }

    private void handlePlayerDisconnect(Player player, DisconnectReason reason) {
        UUID playerId = player.getUniqueId();

        if (!matchManager.isPlayerInMatch(playerId)) {
            return;
        }

        String matchId = matchManager.getMatchIdForPlayer(playerId);
        if (matchId == null) {
            return;
        }

        LOGGER.info("Player " + player.getName() + " disconnected from match " + matchId + " (reason: " + reason + ")");
        matchManager.delegatePlayerDisconnect(playerId, reason);
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();

        if (!matchManager.isPlayerInGracePeriod(playerId)) {
            return;
        }

        String matchId = matchManager.getGracePeriodMatchId(playerId);
        LOGGER.info("Player " + player.getName() + " rejoined during grace period for match " + matchId);

        boolean handled = matchManager.delegatePlayerReconnect(playerId);

        if (handled) {
            player.sendMessage("\u00a7aWelcome back! You have reconnected to your match.");
            LOGGER.info("Player " + player.getName() + " successfully reconnected to match " + matchId);
        } else {
            player.sendMessage("\u00a7cFailed to reconnect to match. The match may have ended.");
            LOGGER.warning("Player " + player.getName() + " failed to reconnect to match " + matchId);
        }
    }

    // ==================== Kit Selection ====================

    @EventHandler(priority = EventPriority.HIGH)
    public void onInventoryClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player)) {
            return;
        }

        Player player = (Player) event.getWhoClicked();
        UUID playerId = player.getUniqueId();

        if (!matchManager.isPlayerInMatch(playerId)) {
            return;
        }

        BaseGame game = matchManager.getGameForPlayer(playerId);
        if (!(game instanceof BuildUHCGame)) {
            return;
        }

        BuildUHCGame uhcGame = (BuildUHCGame) game;
        KitSelectionGUI kitGUI = uhcGame.getKitSelectionGUI();
        if (kitGUI == null) {
            return;
        }

        Inventory clicked = event.getClickedInventory();
        if (clicked != null && kitGUI.handleClick(player, clicked, event.getSlot())) {
            event.setCancelled(true);
        }
    }

    // ==================== Block Events ====================

    @EventHandler(priority = EventPriority.HIGH)
    public void onBlockPlace(BlockPlaceEvent event) {
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();

        if (!matchManager.isPlayerInMatch(playerId)) {
            return;
        }

        BaseGame game = matchManager.getGameForPlayer(playerId);
        if (game == null || !game.isActive()) {
            event.setCancelled(true);
            return;
        }

        if (game instanceof BuildUHCGame) {
            BuildUHCGame uhcGame = (BuildUHCGame) game;
            if (event.getBlock().getY() > uhcGame.getBuildHeightLimit()) {
                event.setCancelled(true);
                player.sendMessage("\u00a7cBuild height limit reached!");
                return;
            }
            uhcGame.trackPlacedBlock(event.getBlock().getLocation());
        } else {
            // Other game types don't support block placement by default
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onBlockBreak(BlockBreakEvent event) {
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();

        if (!matchManager.isPlayerInMatch(playerId)) {
            return;
        }

        BaseGame game = matchManager.getGameForPlayer(playerId);
        if (game == null || !game.isActive()) {
            event.setCancelled(true);
            return;
        }

        if (game instanceof BuildUHCGame) {
            BuildUHCGame uhcGame = (BuildUHCGame) game;
            if (!uhcGame.isPlayerPlacedBlock(event.getBlock().getLocation())) {
                event.setCancelled(true);
                return;
            }
            event.setDropItems(false);
            uhcGame.untrackPlacedBlock(event.getBlock().getLocation());
        } else {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerItemConsume(PlayerItemConsumeEvent event) {
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();

        if (!matchManager.isPlayerInMatch(playerId)) {
            return;
        }

        BaseGame game = matchManager.getGameForPlayer(playerId);
        if (!(game instanceof BuildUHCGame)) {
            return;
        }

        BuildUHCGame uhcGame = (BuildUHCGame) game;
        if (uhcGame.isSuddenDeath()) {
            Material itemType = event.getItem().getType();
            if (itemType == Material.GOLDEN_APPLE || itemType == Material.ENCHANTED_GOLDEN_APPLE) {
                event.setCancelled(true);
                player.sendMessage("\u00a7cHealing is disabled during sudden death!");
            }
        }
    }
}
