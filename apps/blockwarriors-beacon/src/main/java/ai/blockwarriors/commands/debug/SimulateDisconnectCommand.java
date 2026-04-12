package ai.blockwarriors.commands.debug;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import ai.blockwarriors.beacon.Plugin;
import ai.blockwarriors.beacon.game.BaseGame;
import ai.blockwarriors.beacon.game.DisconnectReason;
import ai.blockwarriors.beacon.game.DisconnectResult;
import ai.blockwarriors.beacon.service.MatchManager;

/**
 * Debug command to simulate player disconnect without actual disconnect.
 * 
 * Usage:
 *   /simulatedisconnect <player>           - Simulate quit disconnect
 *   /simulatedisconnect <player> <reason>  - Simulate with specific reason
 *   
 * Reasons: quit, kick, timeout
 */
public class SimulateDisconnectCommand implements CommandExecutor, TabCompleter {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    private final Plugin plugin;
    
    public SimulateDisconnectCommand(Plugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("§cThis command can only be used by players.");
            return true;
        }
        
        Player player = (Player) sender;
        MatchManager matchManager = plugin.getMatchManager();
        
        if (matchManager == null) {
            player.sendMessage("§cMatchManager not initialized.");
            return true;
        }
        
        if (args.length == 0) {
            sendUsage(player);
            return true;
        }
        
        // Find target player
        Player targetPlayer = Bukkit.getPlayer(args[0]);
        if (targetPlayer == null || !targetPlayer.isOnline()) {
            player.sendMessage("§cPlayer not found: §e" + args[0]);
            return true;
        }
        
        // Check if player is in a match
        String matchId = matchManager.getMatchIdForPlayer(targetPlayer.getUniqueId());
        if (matchId == null) {
            player.sendMessage("§c" + targetPlayer.getName() + " is not in an active match.");
            return true;
        }
        
        BaseGame game = matchManager.getGameForMatch(matchId);
        if (game == null) {
            player.sendMessage("§cNo game instance found (legacy match?).");
            return true;
        }
        
        // Parse disconnect reason
        DisconnectReason reason = DisconnectReason.QUIT;
        if (args.length >= 2) {
            String reasonArg = args[1].toUpperCase();
            try {
                reason = DisconnectReason.valueOf(reasonArg);
            } catch (IllegalArgumentException e) {
                player.sendMessage("§cInvalid reason: §e" + args[1]);
                player.sendMessage("§7Valid reasons: quit, kick, timeout");
                return true;
            }
        }
        
        player.sendMessage("§eSimulating disconnect for §f" + targetPlayer.getName() + " §e(reason: " + reason + ")");
        
        // Delegate to match manager
        DisconnectResult result = matchManager.delegatePlayerDisconnect(targetPlayer.getUniqueId(), reason);
        
        if (result == null) {
            player.sendMessage("§cDisconnect not handled (legacy match or game not active).");
            return true;
        }
        
        // Report result
        switch (result) {
            case FORFEIT:
                player.sendMessage("§cResult: §fFORFEIT §7- Other team wins");
                break;
            case GRACE_PERIOD:
                player.sendMessage("§eResult: §fGRACE_PERIOD §7- Waiting for reconnect");
                int gracePeriod = game.getDisconnectPolicy().getGracePeriodSeconds();
                player.sendMessage("§7Grace period: §f" + gracePeriod + " seconds");
                break;
            case CONTINUE:
                player.sendMessage("§aResult: §fCONTINUE §7- Game continues with remaining players");
                break;
            case GAME_CANCELLED:
                player.sendMessage("§cResult: §fGAME_CANCELLED §7- Not enough players");
                break;
        }
        
        LOGGER.info("Simulated disconnect for " + targetPlayer.getName() + ": " + reason + " -> " + result);
        
        return true;
    }
    
    private void sendUsage(Player player) {
        player.sendMessage("§6=== Simulate Disconnect Command ===");
        player.sendMessage("§e/simulatedisconnect <player> §7- Simulate quit");
        player.sendMessage("§e/simulatedisconnect <player> <reason> §7- With reason");
        player.sendMessage("§7Reasons: §fquit§7, §fkick§7, §ftimeout");
    }
    
    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String label, String[] args) {
        List<String> completions = new ArrayList<>();
        
        if (args.length == 1) {
            // Player names
            String partial = args[0].toLowerCase();
            for (Player p : Bukkit.getOnlinePlayers()) {
                if (p.getName().toLowerCase().startsWith(partial)) {
                    completions.add(p.getName());
                }
            }
        } else if (args.length == 2) {
            // Disconnect reasons
            String partial = args[1].toLowerCase();
            for (DisconnectReason reason : DisconnectReason.values()) {
                if (reason.name().toLowerCase().startsWith(partial)) {
                    completions.add(reason.name().toLowerCase());
                }
            }
        }
        
        return completions;
    }
}
