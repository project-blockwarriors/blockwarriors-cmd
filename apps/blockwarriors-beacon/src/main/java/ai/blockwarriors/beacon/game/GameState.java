package ai.blockwarriors.beacon.game;

/**
 * Represents the current state of a game instance.
 */
public enum GameState {
    /** Game is being set up, waiting for initialization */
    INITIALIZING,
    
    /** Game is initialized and ready to start */
    READY,
    
    /** Pre-game countdown is active */
    COUNTDOWN,
    
    /** Game is actively being played */
    IN_PROGRESS,
    
    /** Game is paused (e.g., player disconnected in grace period) */
    PAUSED,
    
    /** Game has ended normally with a winner */
    FINISHED,
    
    /** Game was terminated early (cancelled, error, etc.) */
    TERMINATED
}
