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
import ai.blockwarriors.beacon.service.MatchManager;

/**
 * Debug command to simulate player reconnect during grace period.
 * 
 * Usage:
 *   /simulatereconnect <player> - Simulate player reconnecting
 */
public class SimulateReconnectCommand implements CommandExecutor, TabCompleter {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    private final Plugin plugin;
    
    public SimulateReconnectCommand(Plugin plugin) {
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
            player.sendMessage("§c" + targetPlayer.getName() + " is not registered in an active match.");
            return true;
        }
        
        BaseGame game = matchManager.getGameForMatch(matchId);
        if (game == null) {
            player.sendMessage("§cNo game instance found (legacy match?).");
            return true;
        }
        
        // Check if player is actually in disconnected state
        if (!game.isPlayerDisconnected(targetPlayer.getUniqueId())) {
            player.sendMessage("§e" + targetPlayer.getName() + " §7is not in disconnected state.");
            player.sendMessage("§7Use §e/simulatedisconnect §7first to simulate disconnect.");
            return true;
        }
        
        player.sendMessage("§eSimulating reconnect for §f" + targetPlayer.getName());
        
        // Delegate to match manager
        boolean success = matchManager.delegatePlayerReconnect(targetPlayer.getUniqueId());
        
        if (success) {
            player.sendMessage("§aReconnect successful! §7Player resumed in game.");
            LOGGER.info("Simulated reconnect for " + targetPlayer.getName() + " - success");
        } else {
            player.sendMessage("§cReconnect failed. §7Grace period may have expired.");
            LOGGER.info("Simulated reconnect for " + targetPlayer.getName() + " - failed");
        }
        
        return true;
    }
    
    private void sendUsage(Player player) {
        player.sendMessage("§6=== Simulate Reconnect Command ===");
        player.sendMessage("§e/simulatereconnect <player> §7- Simulate reconnect");
        player.sendMessage("§7Use after §e/simulatedisconnect §7to test grace period.");
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
        }
        
        return completions;
    }
}
