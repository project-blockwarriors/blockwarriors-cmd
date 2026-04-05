package ai.blockwarriors.beacon.game.kit;

import org.bukkit.Material;

import java.util.ArrayList;
import java.util.List;

/**
 * Available archetypes (roles) for Build UHC.
 *
 * Each archetype gives the player a different loadout and play style.
 * All four are always selectable; in 2v2+ teammates cannot pick the same one.
 */
public enum Archetype {

    FIGHTER(
        "Fighter",
        "Combat specialist with a diamond sword and extra golden apples.",
        Material.DIAMOND_SWORD
    ),

    BUILDER(
        "Builder",
        "Building expert with extra blocks and utility items.",
        Material.BRICKS
    ),

    ARCHER(
        "Archer",
        "Ranged specialist with a Power I bow and extra arrows.",
        Material.BOW
    ),

    TANK(
        "Tank",
        "Heavy defender with iron armor and extra healing.",
        Material.IRON_CHESTPLATE
    );

    private final String displayName;
    private final String description;
    private final Material icon;

    Archetype(String displayName, String description, Material icon) {
        this.displayName = displayName;
        this.description = description;
        this.icon = icon;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public Material getIcon() {
        return icon;
    }

    /**
     * Get the archetypes available for a given team size.
     * Currently all four are always available; add more enum values and
     * gate them here when larger team sizes need additional roles.
     */
    public static List<Archetype> getAvailable(int teamSize) {
        List<Archetype> available = new ArrayList<>();
        for (Archetype a : values()) {
            available.add(a);
        }
        return available;
    }
}
