package ai.blockwarriors.events;

import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.CreatureSpawnEvent;
import org.bukkit.event.entity.EntitySpawnEvent;

import java.util.logging.Logger;

/**
 * Prevents mob spawning in match worlds
 */
public class WorldEventListener implements Listener {
    private static final Logger LOGGER = Logger.getLogger("beacon");

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onCreatureSpawn(CreatureSpawnEvent event) {
        // Check if this is a match world (starts with "match_")
        String worldName = event.getLocation().getWorld().getName();
        if (worldName.startsWith("match_")) {
            // Only allow player spawns in match worlds
            if (event.getSpawnReason() != CreatureSpawnEvent.SpawnReason.CUSTOM) {
                event.setCancelled(true);
            }
        }
    }

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onEntitySpawn(EntitySpawnEvent event) {
        // Check if this is a match world
        String worldName = event.getLocation().getWorld().getName();
        if (worldName.startsWith("match_")) {
            // Only allow players in match worlds
            if (event.getEntityType() != org.bukkit.entity.EntityType.PLAYER) {
                event.setCancelled(true);
            }
        }
    }
}

