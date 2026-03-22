package ai.blockwarriors.beacon.service;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.WorldType;

import java.io.File;
import java.util.logging.Logger;

/**
 * Manages Minecraft world creation and deletion for matches.
 * Handles world lifecycle independently from game logic.
 */
public class MatchWorldManager {
    private static final Logger LOGGER = Logger.getLogger("beacon");

    /**
     * Create a new flat world for a match.
     * Finds the lowest unused world number and creates it.
     * Must be called on the main thread (Bukkit API requirement).
     *
     * @param matchId Match identifier (used for logging)
     * @return World name, or null if creation failed
     */
    public String createWorld(String matchId) {
        int worldNumber = 1;
        String worldName = "match_" + worldNumber;
        while (Bukkit.getWorld(worldName) != null) {
            worldNumber++;
            worldName = "match_" + worldNumber;
        }

        try {
            WorldCreator creator = new WorldCreator(worldName);
            creator.type(WorldType.FLAT);
            creator.generateStructures(false);

            World world = creator.createWorld();
            if (world == null) {
                LOGGER.severe("Failed to create world: " + worldName);
                return null;
            }

            world.setSpawnLocation(0, 64, 0);
            world.setSpawnFlags(false, false);
            world.setDifficulty(org.bukkit.Difficulty.PEACEFUL);

            LOGGER.info("Created world " + worldName + " for match " + matchId);
            return worldName;

        } catch (Exception e) {
            LOGGER.severe("Error creating world: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Delete a match world and unload it from memory.
     * Kicks all players to the main world first.
     *
     * @param worldName Name of the world to delete
     */
    public static void deleteWorld(String worldName) {
        try {
            World world = Bukkit.getWorld(worldName);
            if (world != null) {
                world.getPlayers().forEach(player -> {
                    World mainWorld = Bukkit.getWorlds().get(0);
                    if (mainWorld != null && !mainWorld.equals(world)) {
                        player.teleport(mainWorld.getSpawnLocation());
                    } else {
                        player.kickPlayer("Match ended. World is being deleted.");
                    }
                });

                Bukkit.unloadWorld(world, false);

                File worldFolder = world.getWorldFolder();
                if (worldFolder.exists()) {
                    deleteDirectory(worldFolder);
                    LOGGER.info("Deleted match world: " + worldName);
                }
            }
        } catch (Exception e) {
            LOGGER.severe("Error deleting match world " + worldName + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

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
}
