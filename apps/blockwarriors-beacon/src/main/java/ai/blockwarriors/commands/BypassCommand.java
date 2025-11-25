package ai.blockwarriors.commands;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.util.Set;
import java.util.UUID;
import java.util.logging.Logger;

/**
 * Command to bypass login requirement for operators/testing
 * Usage: /bypass [player]
 * If no player specified, toggles bypass for the command sender
 */
public class BypassCommand implements CommandExecutor {
    private final Set<UUID> bypassedPlayers;
    private static final Logger LOGGER = Logger.getLogger("beacon");

    public BypassCommand(Set<UUID> bypassedPlayers) {
        this.bypassedPlayers = bypassedPlayers;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        // Only operators can use this command
        if (!sender.hasPermission("beacon.bypass")) {
            sender.sendMessage("§cYou do not have permission to use this command.");
            return true;
        }

        UUID targetUuid;
        String targetName;

        if (args.length == 0) {
            // Toggle bypass for command sender
            if (!(sender instanceof Player)) {
                sender.sendMessage("§cYou must be a player to use this command without arguments.");
                return true;
            }
            targetUuid = ((Player) sender).getUniqueId();
            targetName = sender.getName();
        } else {
            // Toggle bypass for specified player
            Player target = org.bukkit.Bukkit.getPlayer(args[0]);
            if (target == null) {
                sender.sendMessage("§cPlayer '" + args[0] + "' not found or not online.");
                return true;
            }
            targetUuid = target.getUniqueId();
            targetName = target.getName();
        }

        // Toggle bypass status
        if (bypassedPlayers.contains(targetUuid)) {
            bypassedPlayers.remove(targetUuid);
            sender.sendMessage("§aBypass disabled for " + targetName);
            if (targetUuid != ((sender instanceof Player) ? ((Player) sender).getUniqueId() : null)) {
                Player target = org.bukkit.Bukkit.getPlayer(targetUuid);
                if (target != null) {
                    target.sendMessage("§cLogin bypass has been disabled. You must login to play.");
                }
            }
            LOGGER.info("Bypass disabled for " + targetName + " by " + sender.getName());
        } else {
            bypassedPlayers.add(targetUuid);
            sender.sendMessage("§aBypass enabled for " + targetName);
            if (targetUuid != ((sender instanceof Player) ? ((Player) sender).getUniqueId() : null)) {
                Player target = org.bukkit.Bukkit.getPlayer(targetUuid);
                if (target != null) {
                    target.sendMessage("§aLogin bypass has been enabled. You can now play without logging in.");
                }
            }
            LOGGER.info("Bypass enabled for " + targetName + " by " + sender.getName());
        }

        return true;
    }
}

