package ai.blockwarriors.warriorTelemetry.events;

import ai.blockwarriors.warriorTelemetry.Plugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.md_5.bungee.api.ChatColor;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Statistic;
import org.bukkit.attribute.Attribute;
import org.bukkit.entity.Player;
import org.bukkit.event.Listener;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scoreboard.*;

import java.util.logging.Logger;

public class WarriorEventListener implements Listener {
    private static final Logger LOGGER = Logger.getLogger("WarriorTelemetry");
    private final Plugin plugin;
    private final long updateInterval;

    public WarriorEventListener(Plugin plugin, long updateInterval) {
        this.plugin = plugin;
        this.updateInterval = updateInterval;
        LOGGER.info("WarriorEventListener initialized with periodic tracking (interval: " + updateInterval + " ticks)");
    }

    public void startTracking() {
        new BukkitRunnable() {
            @Override
            public void run() {
                // TODO: Add Convex API call here for sending/retrieving telemetry data

                for (Player viewer : Bukkit.getOnlinePlayers()) {
                    if (plugin.isViewing(viewer)) {
                        Player target = Bukkit.getPlayer(plugin.getViewTarget(viewer));
                        if (target != null && target.isOnline()) {
                            updatePlayerScoreboard(viewer, target);
                        }
                    }
                }
            }
        }.runTaskTimer(plugin, updateInterval, updateInterval);

        LOGGER.info("Started periodic player tracking");
    }

    public void updateScoreboardForViewer(Player viewer) {
        if (plugin.isViewing(viewer)) {
            Player target = Bukkit.getPlayer(plugin.getViewTarget(viewer));
            if (target != null && target.isOnline()) {
                updatePlayerScoreboard(viewer, target);
            }
        }
    }

    private void updatePlayerScoreboard(Player viewer, Player target) {
        ScoreboardManager manager = Bukkit.getScoreboardManager();
        Scoreboard scoreboard = manager.getNewScoreboard();

        Objective objective = scoreboard.registerNewObjective("warrior", Criteria.DUMMY,
            Component.text(target.getName()).color(NamedTextColor.GOLD).decorate(TextDecoration.BOLD));
        objective.setDisplaySlot(DisplaySlot.SIDEBAR);

        Location loc = target.getLocation();
        int line = 15;

        // Health & Food
        double maxHealth = target.getAttribute(Attribute.GENERIC_MAX_HEALTH).getValue();
        setScore(objective, ChatColor.RED + "❤ " + ChatColor.WHITE +
            String.format("%.1f/%.1f", target.getHealth(), maxHealth), line--);
        setScore(objective, ChatColor.YELLOW + "🍖 " + ChatColor.WHITE + target.getFoodLevel(), line--);

        // Blank
        setScore(objective, ChatColor.RESET.toString(), line--);

        // Equipment
        setScore(objective, ChatColor.GOLD + "Equipment:", line--);

        ItemStack mainHand = target.getInventory().getItemInMainHand();
        String mainHandName = (mainHand != null && !mainHand.getType().equals(Material.AIR))
            ? formatItemName(mainHand.getType()) : "None";
        setScore(objective, ChatColor.GRAY + "Hand: " + ChatColor.WHITE + mainHandName, line--);

        // Armor pieces
        ItemStack helmet = target.getInventory().getHelmet();
        ItemStack chestplate = target.getInventory().getChestplate();
        ItemStack leggings = target.getInventory().getLeggings();
        ItemStack boots = target.getInventory().getBoots();

        String helmetName = (helmet != null && !helmet.getType().equals(Material.AIR))
            ? formatItemName(helmet.getType()) : "None";
        setScore(objective, ChatColor.GRAY + "Head: " + ChatColor.WHITE + helmetName, line--);

        String chestName = (chestplate != null && !chestplate.getType().equals(Material.AIR))
            ? formatItemName(chestplate.getType()) : "None";
        setScore(objective, ChatColor.GRAY + "Chest: " + ChatColor.WHITE + chestName, line--);

        String legsName = (leggings != null && !leggings.getType().equals(Material.AIR))
            ? formatItemName(leggings.getType()) : "None";
        setScore(objective, ChatColor.GRAY + "Legs: " + ChatColor.WHITE + legsName, line--);

        String bootsName = (boots != null && !boots.getType().equals(Material.AIR))
            ? formatItemName(boots.getType()) : "None";
        setScore(objective, ChatColor.GRAY + "Feet: " + ChatColor.WHITE + bootsName, line--);

        // Blank
        setScore(objective, ChatColor.RESET + " ", line--);

        // Location
        setScore(objective, ChatColor.AQUA + "Position:", line--);
        setScore(objective, ChatColor.GRAY + String.format("%.0f, %.0f, %.0f", loc.getX(), loc.getY(), loc.getZ()), line--);

        // Blank
        setScore(objective, ChatColor.RESET + "  ", line--);

        // Combat Stats
        setScore(objective, ChatColor.GREEN + "K: " + ChatColor.WHITE + target.getStatistic(Statistic.PLAYER_KILLS) +
            ChatColor.GRAY + " | " + ChatColor.RED + "D: " + ChatColor.WHITE + target.getStatistic(Statistic.DEATHS), line--);

        // Nearby players
        int nearbyCount = 0;
        for (Player nearbyPlayer : Bukkit.getOnlinePlayers()) {
            if (!nearbyPlayer.equals(target) && nearbyPlayer.getWorld().equals(target.getWorld())) {
                double distance = nearbyPlayer.getLocation().distance(target.getLocation());
                if (distance <= 20.0) {
                    nearbyCount++;
                }
            }
        }
        setScore(objective, ChatColor.LIGHT_PURPLE + "Nearby: " + ChatColor.WHITE + nearbyCount, line--);

        viewer.setScoreboard(scoreboard);
    }

    private String formatItemName(Material material) {
        String name = material.name().replace("_", " ").toLowerCase();
        String[] words = name.split(" ");
        StringBuilder formatted = new StringBuilder();
        for (String word : words) {
            if (formatted.length() > 0) formatted.append(" ");
            formatted.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        String result = formatted.toString();
        // Truncate if too long
        return result.length() > 15 ? result.substring(0, 12) + "..." : result;
    }

    private void setScore(Objective objective, String text, int score) {
        Score s = objective.getScore(text);
        s.setScore(score);
    }
}
