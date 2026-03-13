package ai.blockwarriors.commands.debug;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import ai.blockwarriors.beacon.Plugin;
import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.ArenaManager;

/**
 * Debug command to load an arena for testing.
 * 
 * Usage:
 *   /setarena <arena_name> - Load and display arena info
 *   /setarena list         - List all available arenas
 *   /setarena reload       - Reload arena configurations
 */
public class SetArenaCommand implements CommandExecutor, TabCompleter {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    private final Plugin plugin;
    
    public SetArenaCommand(Plugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("§cThis command can only be used by players.");
            return true;
        }
        
        Player player = (Player) sender;
        ArenaManager arenaManager = plugin.getArenaManager();
        
        if (arenaManager == null) {
            player.sendMessage("§cArenaManager not initialized.");
            return true;
        }
        
        if (args.length == 0) {
            sendUsage(player);
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        
        switch (subCommand) {
            case "list":
                listArenas(player, arenaManager);
                break;
            case "reload":
                reloadArenas(player, arenaManager);
                break;
            default:
                showArenaInfo(player, arenaManager, subCommand);
                break;
        }
        
        return true;
    }
    
    private void sendUsage(Player player) {
        player.sendMessage("§6=== Set Arena Command ===");
        player.sendMessage("§e/setarena <arena_name> §7- Show arena info");
        player.sendMessage("§e/setarena list §7- List all arenas");
        player.sendMessage("§e/setarena reload §7- Reload arena configs");
    }
    
    private void listArenas(Player player, ArenaManager arenaManager) {
        player.sendMessage("§6=== Available Arenas ===");
        
        int count = arenaManager.getArenaCount();
        if (count == 0) {
            player.sendMessage("§7No arenas loaded.");
            player.sendMessage("§7Place arena configs in §eplugins/beacon/arenas/");
            return;
        }
        
        for (String arenaName : arenaManager.getArenaNames()) {
            ArenaConfig config = arenaManager.getArena(arenaName);
            if (config != null) {
                String gameType = config.getGameType();
                player.sendMessage("§a  - " + arenaName + " §7[" + gameType + "]");
            }
        }
        
        player.sendMessage("§7Total: §f" + count + " §7arenas");
    }
    
    private void reloadArenas(Player player, ArenaManager arenaManager) {
        player.sendMessage("§eReloading arena configurations...");
        
        int before = arenaManager.getArenaCount();
        arenaManager.loadArenas();
        int after = arenaManager.getArenaCount();
        
        player.sendMessage("§aReloaded! §7Arenas: " + before + " -> " + after);
        LOGGER.info("Arena configs reloaded by " + player.getName());
    }
    
    private void showArenaInfo(Player player, ArenaManager arenaManager, String arenaName) {
        ArenaConfig config = arenaManager.getArena(arenaName);
        
        if (config == null) {
            player.sendMessage("§cArena not found: §e" + arenaName);
            player.sendMessage("§7Use §e/setarena list §7to see available arenas.");
            return;
        }
        
        player.sendMessage("§6=== Arena: " + config.getName() + " ===");
        player.sendMessage("§7Game Type: §f" + config.getGameType());
        
        if (config.hasSchematic()) {
            player.sendMessage("§7Schematic: §f" + config.getSchematicPath());
        }
        
        // Show spawn counts
        int blueSpawns = config.getSpawns("blue_team").size();
        int redSpawns = config.getSpawns("red_team").size();
        player.sendMessage("§7Spawns: §bBlue=" + blueSpawns + " §cRed=" + redSpawns);
        
        // Show boundaries
        if (config.hasBoundaries()) {
            player.sendMessage("§7Boundaries: §fdefined");
        }
        
        // Show objectives
        int objectiveCount = config.getObjectives().size();
        if (objectiveCount > 0) {
            player.sendMessage("§7Objectives: §f" + objectiveCount);
        }
        
        // Show resources
        int resourceCount = config.getResources().size();
        if (resourceCount > 0) {
            player.sendMessage("§7Resource spawns: §f" + resourceCount);
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
            if ("reload".startsWith(partial)) {
                completions.add("reload");
            }
            
            ArenaManager arenaManager = plugin.getArenaManager();
            if (arenaManager != null) {
                for (String arenaName : arenaManager.getArenaNames()) {
                    if (arenaName.toLowerCase().startsWith(partial)) {
                        completions.add(arenaName);
                    }
                }
            }
        }
        
        return completions;
    }
}
