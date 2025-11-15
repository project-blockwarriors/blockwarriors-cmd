package ai.blockwarriors.commands.debug;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class ListLoggedInCommand implements CommandExecutor {
    private final Set<UUID> loggedInPlayers;

    public ListLoggedInCommand(Set<UUID> loggedInPlayers) {
        this.loggedInPlayers = loggedInPlayers;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (sender instanceof Player) {
            Player player = (Player) sender;
            if (loggedInPlayers.isEmpty()) {
                player.sendMessage("No players are currently logged in.");
            } else {
                String loggedInPlayerNames = loggedInPlayers.stream()
                        .map(uuid -> player.getServer().getPlayer(uuid))
                        .filter(p -> p != null)
                        .map(Player::getName)
                        .collect(Collectors.joining(", "));
                player.sendMessage("Logged in players: " + loggedInPlayerNames);
            }
            return true;
        }
        return false;
    }
}