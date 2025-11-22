package ai.blockwarriors.warriorTelemetry;

import ai.blockwarriors.warriorTelemetry.commands.WarriorCommand;
import ai.blockwarriors.warriorTelemetry.events.WarriorEventListener;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;

public final class Plugin extends JavaPlugin {
    private static final Logger LOGGER = Logger.getLogger("WarriorTelemetry");
    private final Map<UUID, UUID> viewers = new HashMap<>(); // viewer UUID -> target UUID
    private WarriorEventListener listener;

    @Override
    public void onEnable() {
        // Plugin startup logic
        LOGGER.info("WarriorTelemetry Plugin has been enabled!");

        // Load configuration
        saveDefaultConfig();
        long updateInterval = getConfig().getLong("update-interval", 20);
        LOGGER.info("Loaded configuration - Update interval: " + updateInterval + " ticks");

        // Register command
        getCommand("warrior-telemetry").setExecutor(new WarriorCommand(this));

        // Instantiate and register the event listener
        listener = new WarriorEventListener(this, updateInterval);
        getServer().getPluginManager().registerEvents(listener, this);

        // Start periodic tracking
        listener.startTracking();
    }

    @Override
    public void onDisable() {
        // Plugin shutdown logic
        LOGGER.info("WarriorTelemetry Plugin has been disabled!");
    }

    public void setViewer(Player viewer, Player target) {
        viewers.put(viewer.getUniqueId(), target.getUniqueId());
    }

    public void removeViewer(Player viewer) {
        viewers.remove(viewer.getUniqueId());
    }

    public boolean isViewing(Player viewer) {
        return viewers.containsKey(viewer.getUniqueId());
    }

    public UUID getViewTarget(Player viewer) {
        return viewers.get(viewer.getUniqueId());
    }

    public Map<UUID, UUID> getViewers() {
        return viewers;
    }

    public WarriorEventListener getListener() {
        return listener;
    }
}
