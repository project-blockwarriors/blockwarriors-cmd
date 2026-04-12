package ai.blockwarriors.beacon.game;

/**
 * Configuration for how a game handles player disconnects.
 * Each game type can define its own policy.
 */
public class DisconnectPolicy {
    
    /** Time in seconds to wait for reconnection (0 = instant forfeit) */
    private final int gracePeriodSeconds;
    
    /** Minimum players per team before forfeit is triggered */
    private final int minPlayersPerTeam;
    
    /** Whether disconnected players can rejoin during grace period */
    private final boolean allowReconnect;
    
    /**
     * Create a disconnect policy with all parameters.
     * 
     * @param gracePeriodSeconds Time to wait for reconnection (0 for instant forfeit)
     * @param minPlayersPerTeam Minimum players needed per team to continue
     * @param allowReconnect Whether players can reconnect during grace period
     */
    public DisconnectPolicy(int gracePeriodSeconds, int minPlayersPerTeam, boolean allowReconnect) {
        this.gracePeriodSeconds = gracePeriodSeconds;
        this.minPlayersPerTeam = minPlayersPerTeam;
        this.allowReconnect = allowReconnect;
    }
    
    /**
     * Create an instant forfeit policy (no grace period, no reconnect).
     */
    public static DisconnectPolicy instantForfeit() {
        return new DisconnectPolicy(0, 1, false);
    }
    
    /**
     * Create a grace period policy.
     * 
     * @param seconds Grace period in seconds
     */
    public static DisconnectPolicy withGracePeriod(int seconds) {
        return new DisconnectPolicy(seconds, 1, true);
    }
    
    /**
     * Create a team game policy that allows continuing with fewer players.
     * 
     * @param gracePeriodSeconds Grace period for reconnection
     * @param minPlayersPerTeam Minimum players required per team
     */
    public static DisconnectPolicy teamGame(int gracePeriodSeconds, int minPlayersPerTeam) {
        return new DisconnectPolicy(gracePeriodSeconds, minPlayersPerTeam, true);
    }
    
    public int getGracePeriodSeconds() {
        return gracePeriodSeconds;
    }
    
    public int getMinPlayersPerTeam() {
        return minPlayersPerTeam;
    }
    
    public boolean isAllowReconnect() {
        return allowReconnect;
    }
    
    /**
     * Check if this policy requires immediate forfeit on disconnect.
     */
    public boolean isInstantForfeit() {
        return gracePeriodSeconds == 0;
    }
    
    @Override
    public String toString() {
        return String.format("DisconnectPolicy{grace=%ds, minPlayers=%d, reconnect=%s}",
                gracePeriodSeconds, minPlayersPerTeam, allowReconnect);
    }
}
