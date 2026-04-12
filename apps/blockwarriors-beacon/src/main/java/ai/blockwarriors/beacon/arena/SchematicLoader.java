package ai.blockwarriors.beacon.arena;

import com.sk89q.worldedit.EditSession;
import com.sk89q.worldedit.WorldEdit;
import com.sk89q.worldedit.bukkit.BukkitAdapter;
import com.sk89q.worldedit.extent.clipboard.Clipboard;
import com.sk89q.worldedit.extent.clipboard.io.ClipboardFormat;
import com.sk89q.worldedit.extent.clipboard.io.ClipboardFormats;
import com.sk89q.worldedit.extent.clipboard.io.ClipboardReader;
import com.sk89q.worldedit.function.operation.Operation;
import com.sk89q.worldedit.function.operation.Operations;
import com.sk89q.worldedit.math.BlockVector3;
import com.sk89q.worldedit.session.ClipboardHolder;

import org.bukkit.Bukkit;
import org.bukkit.World;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.logging.Logger;

/**
 * Loads and pastes WorldEdit schematics (.schem files) into Minecraft worlds.
 *
 * Requires WorldEdit or FAWE to be installed on the server. If unavailable,
 * {@link #isAvailable()} returns false and games should fall back to
 * programmatic arena generation.
 */
public class SchematicLoader {

    private static final Logger LOGGER = Logger.getLogger("beacon");

    private static Boolean worldEditAvailable;

    /**
     * Check if WorldEdit is available on this server.
     */
    public static boolean isAvailable() {
        if (worldEditAvailable == null) {
            worldEditAvailable = Bukkit.getPluginManager().getPlugin("WorldEdit") != null
                    || Bukkit.getPluginManager().getPlugin("FastAsyncWorldEdit") != null;
            if (worldEditAvailable) {
                LOGGER.info("WorldEdit/FAWE detected — schematic loading enabled");
            } else {
                LOGGER.info("WorldEdit/FAWE not found — using programmatic arena generation");
            }
        }
        return worldEditAvailable;
    }

    /**
     * Load a schematic file into a WorldEdit Clipboard.
     *
     * @param schematicFile The .schem file to load
     * @return The loaded Clipboard, or null on failure
     */
    public static Clipboard loadSchematic(File schematicFile) {
        ClipboardFormat format = ClipboardFormats.findByFile(schematicFile);
        if (format == null) {
            LOGGER.warning("Unknown schematic format: " + schematicFile.getName());
            return null;
        }

        try (ClipboardReader reader = format.getReader(new FileInputStream(schematicFile))) {
            Clipboard clipboard = reader.read();
            LOGGER.info("Loaded schematic: " + schematicFile.getName()
                    + " (" + clipboard.getRegion().getVolume() + " blocks)");
            return clipboard;
        } catch (IOException e) {
            LOGGER.severe("Failed to load schematic " + schematicFile.getName() + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * Paste a schematic into a world at the given coordinates.
     *
     * @param schematicFile The .schem file to paste
     * @param world         Target Bukkit world
     * @param x             Paste origin X
     * @param y             Paste origin Y
     * @param z             Paste origin Z
     * @return true if paste succeeded
     */
    public static boolean pasteSchematic(File schematicFile, World world, int x, int y, int z) {
        return pasteSchematic(schematicFile, world, x, y, z, true);
    }

    /**
     * Paste a schematic into a world at the given coordinates.
     *
     * @param schematicFile The .schem file to paste
     * @param world         Target Bukkit world
     * @param x             Paste origin X
     * @param y             Paste origin Y
     * @param z             Paste origin Z
     * @param ignoreAir     If true, air blocks in the schematic won't overwrite existing blocks
     * @return true if paste succeeded
     */
    public static boolean pasteSchematic(File schematicFile, World world, int x, int y, int z, boolean ignoreAir) {
        if (!isAvailable()) {
            LOGGER.warning("Cannot paste schematic — WorldEdit not available");
            return false;
        }

        Clipboard clipboard = loadSchematic(schematicFile);
        if (clipboard == null) {
            return false;
        }

        return pasteClipboard(clipboard, world, x, y, z, ignoreAir);
    }

    /**
     * Paste a pre-loaded Clipboard into a world.
     *
     * @param clipboard The loaded clipboard
     * @param world     Target Bukkit world
     * @param x         Paste origin X
     * @param y         Paste origin Y
     * @param z         Paste origin Z
     * @param ignoreAir Whether to skip air blocks
     * @return true if paste succeeded
     */
    public static boolean pasteClipboard(Clipboard clipboard, World world, int x, int y, int z, boolean ignoreAir) {
        try (EditSession editSession = WorldEdit.getInstance()
                .newEditSession(BukkitAdapter.adapt(world))) {

            Operation operation = new ClipboardHolder(clipboard)
                    .createPaste(editSession)
                    .to(BlockVector3.at(x, y, z))
                    .ignoreAirBlocks(ignoreAir)
                    .build();

            Operations.complete(operation);

            LOGGER.info("Pasted schematic at (" + x + ", " + y + ", " + z + ") in world " + world.getName());
            return true;
        } catch (Exception e) {
            LOGGER.severe("Failed to paste schematic: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
