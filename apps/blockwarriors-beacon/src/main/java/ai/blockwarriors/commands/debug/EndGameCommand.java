package ai.blockwarriors.commands.debug;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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
 * Debug command to force end a game.
 * 
 * Usage:
 *   /endgame              - End current game with no winner
 *   /endgame <winner>     - End current game with specified winner
 *   /endgame blue         - End game with blue team winning
 *   /endgame red          - End game with red team winning
 */
public class EndGameCommand implements CommandExecutor, TabCompleter {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    private final Plugin plugin;
    
    public EndGameCommand(Plugin plugin) {
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
        
        // Find match for this player
        String matchId = matchManager.getMatchIdForPlayer(player.getUniqueId());
        if (matchId == null) {
            player.sendMessage("§cYou are not in an active match.");
            return true;
        }
        
        BaseGame game = matchManager.getGameForMatch(matchId);
        String winnerPlayerId = null;
        
        if (args.length > 0) {
            String winnerArg = args[0].toLowerCase();
            
            if (winnerArg.equals("blue") && game != null) {
                // Get first blue team player
                List<UUID> blueTeam = game.getBlueTeam();
                if (!blueTeam.isEmpty()) {
                    winnerPlayerId = blueTeam.get(0).toString();
                    player.sendMessage("§aEnding game with §bblue team §aas winner.");
                }
            } else if (winnerArg.equals("red") && game != null) {
                // Get first red team player
                List<UUID> redTeam = game.getRedTeam();
                if (!redTeam.isEmpty()) {
                    winnerPlayerId = redTeam.get(0).toString();
                    player.sendMessage("§aEnding game with §cred team §aas winner.");
                }
            } else if (winnerArg.equals("none") || winnerArg.equals("draw")) {
                winnerPlayerId = null;
                player.sendMessage("§aEnding game with no winner (draw).");
            } else {
                // Try to find player by name
                Player winner = Bukkit.getPlayer(args[0]);
                if (winner != null && winner.isOnline()) {
                    winnerPlayerId = winner.getUniqueId().toString();
                    player.sendMessage("§aEnding game with §e" + winner.getName() + " §aas winner.");
                } else {
                    player.sendMessage("§cPlayer not found: §e" + args[0]);
                    player.sendMessage("§7Use: §e/endgame [blue|red|none|<player>]");
                    return true;
                }
            }
        } else {
            player.sendMessage("§aEnding game with no winner.");
        }
        
        // End the match
        LOGGER.info("Force ending match " + matchId + " by command from " + player.getName());
        matchManager.endMatch(matchId, winnerPlayerId);
        
        return true;
    }
    
    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String label, String[] args) {
        List<String> completions = new ArrayList<>();
        
        if (args.length == 1) {
            String partial = args[0].toLowerCase();
            
            // Add team options
            if ("blue".startsWith(partial)) {
                completions.add("blue");
            }
            if ("red".startsWith(partial)) {
                completions.add("red");
            }
            if ("none".startsWith(partial)) {
                completions.add("none");
            }
            if ("draw".startsWith(partial)) {
                completions.add("draw");
            }
            
            // Add online player names
            for (Player p : Bukkit.getOnlinePlayers()) {
                if (p.getName().toLowerCase().startsWith(partial)) {
                    completions.add(p.getName());
                }
            }
        }
        
        return completions;
    }
}
