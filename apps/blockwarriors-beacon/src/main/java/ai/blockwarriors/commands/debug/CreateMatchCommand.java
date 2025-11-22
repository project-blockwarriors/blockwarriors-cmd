package ai.blockwarriors.commands.debug;

import java.io.File;
import java.util.logging.Logger;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.WorldType;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class CreateMatchCommand implements CommandExecutor {

    // Invariant: player1 and player2 are valid online player objects
    // Returns the world name created, or null if creation failed
    public static String createMatch(Player player1, Player player2) {
        Logger logger = Bukkit.getLogger();
        
        // Find the lowest unused world number
        int worldNumber = 1;
        String worldName = "match_" + worldNumber;
        while (Bukkit.getWorld(worldName) != null) {
            worldNumber++;
            worldName = "match_" + worldNumber;
        }

        try {
            // Create a new flat world using Bukkit's WorldCreator
            WorldCreator creator = new WorldCreator(worldName);
            creator.type(WorldType.FLAT);
            creator.generateStructures(false); // No structures like villages
            
            World world = creator.createWorld();
            
            if (world == null) {
                logger.severe("Failed to create world: " + worldName);
                return null;
            }

            // Configure world settings
            world.setSpawnLocation(0, 64, 0);
            
            // Disable mob spawning - only allow players
            world.setSpawnFlags(false, false); // No monsters, no animals
            
            // Set world difficulty to peaceful to prevent hostile mobs
            world.setDifficulty(org.bukkit.Difficulty.PEACEFUL);
            
            // Note: Additional mob prevention is handled by WorldEventListener
            // which cancels all creature and entity spawns in match worlds
            
            // Set both players to survival mode
            player1.setGameMode(GameMode.SURVIVAL);
            player2.setGameMode(GameMode.SURVIVAL);
            
            // Teleport player1 to specific coordinates (5 blocks east of spawn, Y = -61)
            Location player1Loc = new Location(world, 5, -61, 0);
            player1.teleport(player1Loc);
            
            // Teleport player2 to specific coordinates (5 blocks west of spawn, Y = -61)
            Location player2Loc = new Location(world, -5, -61, 0);
            player2.teleport(player2Loc);
            
            // Clear inventories and reset health/hunger for fair start
            player1.getInventory().clear();
            player2.getInventory().clear();
            player1.setHealth(20.0);
            player2.setHealth(20.0);
            player1.setFoodLevel(20);
            player2.setFoodLevel(20);
            player1.setSaturation(20.0f);
            player2.setSaturation(20.0f);

            logger.info("Created match world: " + worldName + " for players " + 
                       player1.getName() + " and " + player2.getName());
            
            return worldName;
        } catch (Exception e) {
            logger.severe("Error creating match world: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Delete a match world and unload it from memory
     */
    public static void deleteMatchWorld(String worldName) {
        Logger logger = Bukkit.getLogger();
        
        try {
            World world = Bukkit.getWorld(worldName);
            if (world != null) {
                // Kick all players from the world first
                world.getPlayers().forEach(player -> {
                    // Teleport to main world or kick
                    World mainWorld = Bukkit.getWorlds().get(0);
                    if (mainWorld != null && !mainWorld.equals(world)) {
                        player.teleport(mainWorld.getSpawnLocation());
                    } else {
                        player.kickPlayer("Match ended. World is being deleted.");
                    }
                });

                // Unload the world
                Bukkit.unloadWorld(world, false);

                // Delete the world folder
                File worldFolder = world.getWorldFolder();
                if (worldFolder.exists()) {
                    deleteDirectory(worldFolder);
                    logger.info("Deleted match world: " + worldName);
                }
            }
        } catch (Exception e) {
            logger.severe("Error deleting match world " + worldName + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Recursively delete a directory
     */
    private static void deleteDirectory(File directory) {
        if (directory.exists()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        deleteDirectory(file);
                    } else {
                        file.delete();
                    }
                }
            }
            directory.delete();
        }
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
