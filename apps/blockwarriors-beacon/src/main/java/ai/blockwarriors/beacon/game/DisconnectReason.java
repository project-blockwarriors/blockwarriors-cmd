package ai.blockwarriors.beacon.game;

/**
 * Reasons why a player may disconnect during a match.
 */
public enum DisconnectReason {
    /** Player voluntarily quit the game */
    QUIT,
    
    /** Player was kicked by server/admin */
    KICK,
    
    /** Player connection timed out */
    TIMEOUT
}
