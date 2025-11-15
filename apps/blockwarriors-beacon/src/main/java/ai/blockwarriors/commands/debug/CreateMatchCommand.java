package ai.blockwarriors.commands.debug;

import java.util.logging.Logger;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.WorldType;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import com.onarandombox.MultiverseCore.MultiverseCore;
import com.onarandombox.MultiverseCore.api.MVWorldManager;

public class CreateMatchCommand implements CommandExecutor {

    private MVWorldManager worldManager;


    // Invariant: player1 and player2 are valid online player objects
    public static void createMatch(Player player1, Player player2) {
        // create a new world called "world#" where # is the lowest non used world number
        int worldNumber = 1;
        while (Bukkit.getWorld("world" + worldNumber) != null) {
            worldNumber++;
        }

        // Create a new world using multiverse-core and send both players to that world
        MultiverseCore core = (MultiverseCore) Bukkit.getServer().getPluginManager().getPlugin("Multiverse-Core");
        MVWorldManager worldManager = core.getMVWorldManager();
        worldManager.addWorld(
                "world" + worldNumber, // The worldname
                World.Environment.NORMAL, // The overworld environment type.
                null, // The world seed. Any seed is fine for me, so we just pass null.
                WorldType.FLAT, // Nothing special. If you want something like a flat world, change this.
                false, // This means we want to structures like villages to generator, Change to false
                       // if you don't want this.
                null // Specifies a custom generator. We are not using any so we just pass null.
        );

        // Teleport player1 to specific coordinates in the new world
        player1.teleport(Bukkit.getWorld("world" + worldNumber).getSpawnLocation().add(5, 0, 0));
        // Teleport player2 to specific coordinates in the new world
        player2.teleport(Bukkit.getWorld("world" + worldNumber).getSpawnLocation().add(-5, 0, 0));

    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (sender instanceof Player) {
            Logger logger = Bukkit.getLogger();
            logger.info("Received arguments: " + args);
            logger.info("Received label: " + label);
            logger.info("Received command: " + command);

            Player player = (Player) sender;
            if (args.length != 2) {
                player.sendMessage("Usage: /creatematch <player1> <player2>");
                return false;
            }
            String player1 = args[0];
            String player2 = args[1];
            System.out.println("Player1: " + player1);
            System.out.println("Player2: " + player2);

            // Gets the minecraft player object from the player's IGN
            Player player1Obj = Bukkit.getPlayer(player1);
            Player player2Obj = Bukkit.getPlayer(player2);

            // Check if the player is online
            if (player1Obj == null || player2Obj == null) {
                player.sendMessage("Player is not online.");
                return false;
            }

            // Check if the player is the same
            if (player1Obj == player2Obj) {
                player.sendMessage("You cannot play against yourself.");
                return false;
            }

            // Create the match
            createMatch(player1Obj, player2Obj);
            return false;
        }
        return true;
    }
}
