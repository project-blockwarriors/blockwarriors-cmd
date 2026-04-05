package ai.blockwarriors.beacon.game.kit;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.*;
import java.util.logging.Logger;

/**
 * Hypixel-style chest GUI that lets players pick an {@link Archetype} before
 * the match starts.
 *
 * <p>In 2v2+ games, teammates are blocked from choosing the same archetype.</p>
 */
public class KitSelectionGUI {

    private static final Logger LOGGER = Logger.getLogger("beacon");
    private static final String INVENTORY_TITLE = ChatColor.DARK_PURPLE + "" + ChatColor.BOLD + "Select Your Kit";
    private static final int INVENTORY_SIZE = 27; // 3 rows

    private final Map<UUID, Archetype> selections = new HashMap<>();
    private final Set<Inventory> openInventories = Collections.newSetFromMap(new WeakHashMap<>());

    private final List<UUID> blueTeam;
    private final List<UUID> redTeam;
    private final int teamSize;

    /**
     * @param blueTeam  blue team player UUIDs
     * @param redTeam   red team player UUIDs
     * @param teamSize  players per team (drives duplicate-prevention)
     */
    public KitSelectionGUI(List<UUID> blueTeam, List<UUID> redTeam, int teamSize) {
        this.blueTeam = blueTeam;
        this.redTeam = redTeam;
        this.teamSize = teamSize;
    }

    /**
     * Open the kit selection chest for a player.
     */
    public void openFor(Player player) {
        UUID playerId = player.getUniqueId();
        List<Archetype> available = Archetype.getAvailable(teamSize);

        Set<Archetype> takenByTeammates = getTeammatePicks(playerId);

        Inventory inv = Bukkit.createInventory(null, INVENTORY_SIZE, INVENTORY_TITLE);

        // Fill background with gray glass panes
        ItemStack filler = namedItem(Material.GRAY_STAINED_GLASS_PANE, " ");
        for (int i = 0; i < INVENTORY_SIZE; i++) {
            inv.setItem(i, filler);
        }

        // Place archetype icons evenly across the middle row (slots 10-16)
        int[] slots = centerSlots(available.size());
        for (int i = 0; i < available.size(); i++) {
            Archetype arch = available.get(i);
            boolean taken = takenByTeammates.contains(arch);
            boolean selected = arch.equals(selections.get(playerId));
            inv.setItem(slots[i], buildIcon(arch, taken, selected));
        }

        openInventories.add(inv);
        player.openInventory(inv);
    }

    /**
     * Handle a click inside the kit selection inventory.
     *
     * @return true if the click was inside this GUI (so the caller should cancel the event)
     */
    public boolean handleClick(Player player, Inventory clickedInventory, int slot) {
        if (!openInventories.contains(clickedInventory)) {
            return false;
        }

        ItemStack clicked = clickedInventory.getItem(slot);
        if (clicked == null || clicked.getType() == Material.GRAY_STAINED_GLASS_PANE
                || clicked.getType() == Material.BARRIER) {
            return true; // still our GUI, just a dead slot
        }

        Archetype chosen = archetypeFromSlot(clicked);
        if (chosen == null) {
            return true;
        }

        UUID playerId = player.getUniqueId();

        // In 2v2+ prevent teammates from picking the same archetype
        if (teamSize > 1) {
            Set<Archetype> takenByTeammates = getTeammatePicks(playerId);
            if (takenByTeammates.contains(chosen)) {
                player.sendMessage(ChatColor.RED + "A teammate already picked " + chosen.getDisplayName() + "!");
                return true;
            }
        }

        selections.put(playerId, chosen);
        player.sendMessage(ChatColor.GREEN + "You selected " + ChatColor.GOLD + chosen.getDisplayName()
                + ChatColor.GREEN + "!");
        player.closeInventory();

        LOGGER.info("Player " + player.getName() + " selected archetype " + chosen.name());
        return true;
    }

    /**
     * Check whether a given inventory belongs to this GUI.
     */
    public boolean isKitInventory(Inventory inventory) {
        return openInventories.contains(inventory);
    }

    /**
     * Get the archetype a player selected, or the default if they didn't pick.
     */
    public Archetype getSelection(UUID playerId) {
        return selections.getOrDefault(playerId, Archetype.FIGHTER);
    }

    /**
     * Check if a player has explicitly made a selection.
     */
    public boolean hasSelected(UUID playerId) {
        return selections.containsKey(playerId);
    }

    /**
     * Close all open kit selection inventories.
     */
    public void closeAll() {
        for (UUID id : blueTeam) {
            Player p = Bukkit.getPlayer(id);
            if (p != null && p.isOnline() && openInventories.contains(p.getOpenInventory().getTopInventory())) {
                p.closeInventory();
            }
        }
        for (UUID id : redTeam) {
            Player p = Bukkit.getPlayer(id);
            if (p != null && p.isOnline() && openInventories.contains(p.getOpenInventory().getTopInventory())) {
                p.closeInventory();
            }
        }
        openInventories.clear();
    }

    // ----- helpers -----

    private Set<Archetype> getTeammatePicks(UUID playerId) {
        Set<Archetype> taken = EnumSet.noneOf(Archetype.class);
        List<UUID> team = blueTeam.contains(playerId) ? blueTeam : redTeam;
        for (UUID mate : team) {
            if (!mate.equals(playerId) && selections.containsKey(mate)) {
                taken.add(selections.get(mate));
            }
        }
        return taken;
    }

    private ItemStack buildIcon(Archetype arch, boolean takenByTeammate, boolean currentlySelected) {
        if (takenByTeammate) {
            ItemStack barrier = new ItemStack(Material.BARRIER, 1);
            ItemMeta meta = barrier.getItemMeta();
            meta.setDisplayName(ChatColor.RED + "" + ChatColor.STRIKETHROUGH + arch.getDisplayName()
                    + ChatColor.RED + " (taken)");
            meta.setLore(Collections.singletonList(ChatColor.GRAY + "A teammate already picked this kit."));
            barrier.setItemMeta(meta);
            return barrier;
        }

        ItemStack icon = new ItemStack(arch.getIcon(), 1);
        ItemMeta meta = icon.getItemMeta();

        ChatColor nameColor = currentlySelected ? ChatColor.GREEN : ChatColor.GOLD;
        String prefix = currentlySelected ? ChatColor.GREEN + "[SELECTED] " : "";
        meta.setDisplayName(prefix + nameColor + "" + ChatColor.BOLD + arch.getDisplayName());

        List<String> lore = new ArrayList<>();
        lore.add(ChatColor.GRAY + arch.getDescription());
        lore.add("");
        lore.add(ChatColor.YELLOW + "Click to select!");
        meta.setLore(lore);

        icon.setItemMeta(meta);
        return icon;
    }

    private Archetype archetypeFromSlot(ItemStack item) {
        if (item == null || !item.hasItemMeta() || !item.getItemMeta().hasDisplayName()) {
            return null;
        }
        String raw = ChatColor.stripColor(item.getItemMeta().getDisplayName());
        // Strip "[SELECTED] " prefix if present
        if (raw.startsWith("[SELECTED] ")) {
            raw = raw.substring("[SELECTED] ".length());
        }
        for (Archetype a : Archetype.values()) {
            if (a.getDisplayName().equals(raw)) {
                return a;
            }
        }
        return null;
    }

    /**
     * Return slot indices centred in the middle row of a 27-slot inventory.
     */
    private int[] centerSlots(int count) {
        // Middle row is slots 9-17. Centre the items within that row.
        int start = 9 + (9 - count) / 2;
        int[] slots = new int[count];
        for (int i = 0; i < count; i++) {
            slots[i] = start + i;
        }
        return slots;
    }

    private static ItemStack namedItem(Material material, String name) {
        ItemStack item = new ItemStack(material, 1);
        ItemMeta meta = item.getItemMeta();
        meta.setDisplayName(name);
        item.setItemMeta(meta);
        return item;
    }
}
