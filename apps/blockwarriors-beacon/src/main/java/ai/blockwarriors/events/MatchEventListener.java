package ai.blockwarriors.events;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerQuitEvent;

import ai.blockwarriors.beacon.game.DisconnectReason;
import ai.blockwarriors.beacon.game.DisconnectResult;
import ai.blockwarriors.beacon.service.MatchManager;

import java.util.logging.Logger;
import java.util.UUID;

/**
 * Handles match-related events like player deaths and disconnects.
 * Delegates to BaseGame instances when available, falls back to legacy behavior otherwise.
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

        // Check if player is in an active match
        if (!matchManager.isPlayerInMatch(deadPlayerId)) {
            return; // Not in a match, ignore
        }

        String matchId = matchManager.getMatchIdForPlayer(deadPlayerId);
        if (matchId == null) {
            return;
        }

        LOGGER.info("Player " + deadPlayer.getName() + " died in match " + matchId);

        // Get killer (may be null for environmental deaths)
        Player killer = deadPlayer.getKiller();

        // Try to delegate to game instance first
        if (matchManager.delegatePlayerDeath(deadPlayer, killer)) {
            LOGGER.info("Death handled by game instance for match " + matchId);
            return; // Game handled it
        }

        // Legacy fallback: Find the winner (the other player in the match)
        LOGGER.info("Using legacy death handling for match " + matchId);
        UUID winnerId = null;
        for (UUID playerId : matchManager.getPlayersInMatch(matchId)) {
            if (!playerId.equals(deadPlayerId)) {
                Player winner = Bukkit.getPlayer(playerId);
                if (winner != null && winner.isOnline()) {
                    winnerId = playerId;
                    winner.sendMessage("§aYou won the match! " + deadPlayer.getName() + " has been eliminated.");
                    break;
                }
            }
        }

        // End the match
        if (winnerId != null) {
            matchManager.endMatch(matchId, winnerId.toString());
            deadPlayer.sendMessage("§cYou lost the match. Returning to lobby...");
        } else {
            // No winner found (both players might have died simultaneously or other player left)
            matchManager.endMatch(matchId, null);
        }
    }

    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        UUID playerId = player.getUniqueId();

        // Check if player is in an active match
        if (!matchManager.isPlayerInMatch(playerId)) {
            return;
        }

        String matchId = matchManager.getMatchIdForPlayer(playerId);
        if (matchId == null) {
            return;
        }

        LOGGER.info("Player " + player.getName() + " disconnected from match " + matchId);

        // Try to delegate to game instance first
        DisconnectResult result = matchManager.delegatePlayerDisconnect(playerId, DisconnectReason.QUIT);
        if (result != null) {
            LOGGER.info("Disconnect handled by game instance: " + result);
            return; // Game handled it
        }

        // Legacy fallback: Treat disconnect as forfeit
        LOGGER.info("Using legacy disconnect handling for match " + matchId);

        // Find the winner (the other player who is still connected)
        UUID winnerId = null;
        for (UUID otherPlayerId : matchManager.getPlayersInMatch(matchId)) {
            if (!otherPlayerId.equals(playerId)) {
                Player winner = Bukkit.getPlayer(otherPlayerId);
                if (winner != null && winner.isOnline()) {
                    winnerId = otherPlayerId;
                    winner.sendMessage("§aYou won the match! " + player.getName() + " has disconnected.");
                    break;
                }
            }
        }

        // End the match with the other player as winner
        matchManager.endMatch(matchId, winnerId != null ? winnerId.toString() : null);
    }
}

