package ai.blockwarriors.commands.debug;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
 * Debug command to simulate game objective events.
 * 
 * Usage:
 *   /triggerobjective <objective_type>              - Trigger for self
 *   /triggerobjective <objective_type> <player>    - Trigger for specific player
 *   /triggerobjective list                          - List common objectives
 */
public class TriggerObjectiveCommand implements CommandExecutor, TabCompleter {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    // Common objective types for tab completion
    private static final String[] COMMON_OBJECTIVES = {
        "flag_capture",
        "flag_pickup",
        "flag_return",
        "bed_destroyed",
        "wool_placed",
        "wool_collected",
        "checkpoint",
        "goal_scored",
        "tile_stepped",
        "bridge_crossed"
    };
    
    private final Plugin plugin;
    
    public TriggerObjectiveCommand(Plugin plugin) {
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
        
        String subCommand = args[0].toLowerCase();
        
        if (subCommand.equals("list")) {
            listObjectives(player);
            return true;
        }
        
        // Determine target player
        Player targetPlayer;
        if (args.length >= 2) {
            targetPlayer = Bukkit.getPlayer(args[1]);
            if (targetPlayer == null || !targetPlayer.isOnline()) {
                player.sendMessage("§cPlayer not found: §e" + args[1]);
                return true;
            }
        } else {
            targetPlayer = player;
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
        
        if (!game.isActive()) {
            player.sendMessage("§cGame is not currently active.");
            return true;
        }
        
        String objectiveType = args[0];
        
        // Build objective data (could be extended to parse additional args)
        Map<String, Object> data = new HashMap<>();
        data.put("triggered_by_command", true);
        data.put("sender", player.getName());
        
        // Parse additional key=value pairs
        for (int i = 2; i < args.length; i++) {
            String[] parts = args[i].split("=", 2);
            if (parts.length == 2) {
                data.put(parts[0], parts[1]);
            }
        }
        
        // Trigger the objective via MatchManager delegation
        boolean handled = matchManager.delegateObjective(targetPlayer, objectiveType, data);
        
        if (handled) {
            player.sendMessage("§aTriggered objective: §e" + objectiveType + " §afor §e" + targetPlayer.getName());
            LOGGER.info("Objective " + objectiveType + " triggered by command for " + targetPlayer.getName());
        } else {
            player.sendMessage("§eObjective not handled by game: §7" + objectiveType);
            player.sendMessage("§7The game may not support this objective type.");
        }
        
        return true;
    }
    
    private void sendUsage(Player player) {
        player.sendMessage("§6=== Trigger Objective Command ===");
        player.sendMessage("§e/triggerobjective <type> §7- Trigger for self");
        player.sendMessage("§e/triggerobjective <type> <player> §7- Trigger for player");
        player.sendMessage("§e/triggerobjective <type> <player> key=value §7- With data");
        player.sendMessage("§e/triggerobjective list §7- List common objectives");
    }
    
    private void listObjectives(Player player) {
        player.sendMessage("§6=== Common Objective Types ===");
        player.sendMessage("§7These are common objectives. Game-specific types may vary.");
        for (String obj : COMMON_OBJECTIVES) {
            player.sendMessage("§a  - " + obj);
        }
    }
    
    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String label, String[] args) {
        List<String> completions = new ArrayList<>();
        
        if (args.length == 1) {
            String partial = args[0].toLowerCase();
            
            if ("list".startsWith(partial)) {
                completions.add("list");
            }
            
            for (String obj : COMMON_OBJECTIVES) {
                if (obj.startsWith(partial)) {
                    completions.add(obj);
                }
            }
        } else if (args.length == 2) {
            // Player names
            String partial = args[1].toLowerCase();
            for (Player p : Bukkit.getOnlinePlayers()) {
                if (p.getName().toLowerCase().startsWith(partial)) {
                    completions.add(p.getName());
                }
            }
        }
        
        return completions;
    }
}
