package ai.blockwarriors.beacon.game;

/**
 * Result of handling a player disconnect.
 * Each game type decides how to respond to disconnects.
 */
public enum DisconnectResult {
    /** Other team wins immediately */
    FORFEIT,
    
    /** Wait for player to reconnect within grace period */
    GRACE_PERIOD,
    
    /** Game continues with remaining players (team games) */
    CONTINUE,
    
    /** Game is cancelled (e.g., not enough players) */
    GAME_CANCELLED
}
