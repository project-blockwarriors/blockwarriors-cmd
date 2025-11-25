package ai.blockwarriors.warriorTelemetry.commands;

import ai.blockwarriors.warriorTelemetry.Plugin;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class WarriorCommand implements CommandExecutor {
    private final Plugin plugin;

    public WarriorCommand(Plugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(ChatColor.RED + "This command can only be used by players.");
            return true;
        }

        Player viewer = (Player) sender;

        if (args.length < 2) {
            sender.sendMessage(ChatColor.RED + "Usage: /warrior-telemetry view <player>");
            return true;
        }

        if (!args[0].equalsIgnoreCase("view")) {
            sender.sendMessage(ChatColor.RED + "Usage: /warrior-telemetry view <player>");
            return true;
        }

        String targetName = args[1];
        Player target = Bukkit.getPlayer(targetName);

        if (target == null) {
            sender.sendMessage(ChatColor.RED + "Player '" + targetName + "' not found or not online.");
            return true;
        }

        if (plugin.isViewing(viewer) && plugin.getViewTarget(viewer).equals(target.getUniqueId())) {
            plugin.removeViewer(viewer);
            sender.sendMessage(ChatColor.YELLOW + "Stopped viewing " + target.getName());
            // Reset scoreboard to default
            viewer.setScoreboard(Bukkit.getScoreboardManager().getMainScoreboard());
        } else {
            plugin.setViewer(viewer, target);
            sender.sendMessage(ChatColor.GREEN + "Now viewing " + target.getName() + "'s stats");
            // Immediately display the scoreboard
            plugin.getListener().updateScoreboardForViewer(viewer);
        }

        return true;
    }
}
