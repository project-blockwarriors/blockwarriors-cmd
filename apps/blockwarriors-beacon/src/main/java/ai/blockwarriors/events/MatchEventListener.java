package ai.blockwarriors.events;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;

import ai.blockwarriors.beacon.service.MatchManager;

import java.util.logging.Logger;
import java.util.UUID;

/**
 * Handles match-related events like player deaths
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

        // Find the winner (the other player in the match)
        UUID winnerId = null;
        for (UUID playerId : matchManager.getPlayersInMatch(matchId)) {
            if (!playerId.equals(deadPlayerId)) {
                Player winner = org.bukkit.Bukkit.getPlayer(playerId);
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
}

