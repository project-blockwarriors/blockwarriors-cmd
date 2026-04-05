package ai.blockwarriors.beacon.game.kit;

import org.bukkit.Color;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.LeatherArmorMeta;
import org.bukkit.potion.PotionEffect;

/**
 * Defines and applies the full inventory loadout for each {@link Archetype}.
 *
 * Kit table:
 * <pre>
 * Archetype | Sword         | Bow         | Arrows | Blocks | GApples | Special
 * ----------+---------------+-------------+--------+--------+---------+---------------------------
 * FIGHTER   | Diamond Sword | Bow         | 16     | 32     | 3       | Fishing Rod
 * BUILDER   | Iron Sword    | Bow         | 16     | 128    | 2       | Water Bucket, Fishing Rod
 * ARCHER    | Stone Sword   | Power I Bow | 48     | 32     | 2       | Fishing Rod
 * TANK      | Stone Sword   | Bow         | 16     | 32     | 4       | Iron Chestplate, Iron Boots
 * </pre>
 */
public final class KitDefinition {

    private KitDefinition() {}

    /**
     * Clear the player's inventory and apply the loadout for the given archetype.
     *
     * @param player    target player
     * @param archetype chosen archetype
     * @param team      "blue" or "red" — determines block colour
     */
    public static void applyKit(Player player, Archetype archetype, String team) {
        player.getInventory().clear();
        player.getInventory().setArmorContents(null);

        Material blockMaterial = "blue".equals(team) ? Material.BLUE_CONCRETE : Material.RED_CONCRETE;

        switch (archetype) {
            case FIGHTER:
                applyFighter(player, blockMaterial);
                break;
            case BUILDER:
                applyBuilder(player, blockMaterial);
                break;
            case ARCHER:
                applyArcher(player, blockMaterial);
                break;
            case TANK:
                applyTank(player, blockMaterial, team);
                break;
        }

        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.setSaturation(20.0f);

        for (PotionEffect effect : player.getActivePotionEffects()) {
            player.removePotionEffect(effect.getType());
        }
    }

    // ----- individual kits -----

    private static void applyFighter(Player player, Material blocks) {
        player.getInventory().addItem(new ItemStack(Material.DIAMOND_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 16));
        player.getInventory().addItem(new ItemStack(Material.FISHING_ROD, 1));
        player.getInventory().addItem(new ItemStack(blocks, 32));
        player.getInventory().addItem(new ItemStack(Material.GOLDEN_APPLE, 3));
    }

    private static void applyBuilder(Player player, Material blocks) {
        player.getInventory().addItem(new ItemStack(Material.IRON_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 16));
        player.getInventory().addItem(new ItemStack(Material.FISHING_ROD, 1));
        player.getInventory().addItem(new ItemStack(blocks, 64));
        player.getInventory().addItem(new ItemStack(blocks, 64));
        player.getInventory().addItem(new ItemStack(Material.GOLDEN_APPLE, 2));
        player.getInventory().addItem(new ItemStack(Material.WATER_BUCKET, 1));
    }

    private static void applyArcher(Player player, Material blocks) {
        player.getInventory().addItem(new ItemStack(Material.STONE_SWORD, 1));

        ItemStack bow = new ItemStack(Material.BOW, 1);
        ItemMeta bowMeta = bow.getItemMeta();
        bowMeta.addEnchant(Enchantment.POWER, 1, true);
        bow.setItemMeta(bowMeta);
        player.getInventory().addItem(bow);

        player.getInventory().addItem(new ItemStack(Material.ARROW, 48));
        player.getInventory().addItem(new ItemStack(Material.FISHING_ROD, 1));
        player.getInventory().addItem(new ItemStack(blocks, 32));
        player.getInventory().addItem(new ItemStack(Material.GOLDEN_APPLE, 2));
    }

    private static void applyTank(Player player, Material blocks, String team) {
        player.getInventory().addItem(new ItemStack(Material.STONE_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 16));
        player.getInventory().addItem(new ItemStack(blocks, 32));
        player.getInventory().addItem(new ItemStack(Material.GOLDEN_APPLE, 4));

        player.getInventory().setChestplate(new ItemStack(Material.IRON_CHESTPLATE, 1));
        player.getInventory().setBoots(new ItemStack(Material.IRON_BOOTS, 1));

        Color armorColor = "blue".equals(team) ? Color.BLUE : Color.RED;
        player.getInventory().setHelmet(coloredLeather(Material.LEATHER_HELMET, armorColor));
        player.getInventory().setLeggings(coloredLeather(Material.LEATHER_LEGGINGS, armorColor));
    }

    private static ItemStack coloredLeather(Material material, Color color) {
        ItemStack item = new ItemStack(material, 1);
        LeatherArmorMeta meta = (LeatherArmorMeta) item.getItemMeta();
        meta.setColor(color);
        item.setItemMeta(meta);
        return item;
    }
}
