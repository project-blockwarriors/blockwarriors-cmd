package ai.blockwarriors.beacon.game;

import org.bukkit.plugin.java.JavaPlugin;

/**
 * Factory interface for creating game instances.
 * 
 * Each game type must provide a factory that can create new game instances.
 * The factory is registered with GameRegistry and used by MatchPollingService
 * to instantiate games when matches are ready to start.
 */
@FunctionalInterface
public interface GameFactory {
    
    /**
     * Create a new game instance.
     * 
     * @param plugin The JavaPlugin instance for scheduling tasks
     * @param matchId Unique match identifier from the backend
     * @return A new BaseGame instance ready to be initialized
     */
    BaseGame createGame(JavaPlugin plugin, String matchId);
}
