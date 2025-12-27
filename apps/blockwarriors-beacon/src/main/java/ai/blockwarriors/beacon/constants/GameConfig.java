package ai.blockwarriors.beacon.constants;

/**
 * Game configuration constants.
 * 
 * IMPORTANT: Keep in sync with packages/shared/constants/game-config.json
 * This file should be manually updated when the JSON source changes.
 * The Beacon plugin trusts the backend for actual values; these are for
 * documentation and local validation purposes.
 * 
 * @see packages/shared/constants/game-config.json
 */
public final class GameConfig {
    
    private GameConfig() {
        // Prevent instantiation
    }
    
    // ==================== Game Types ====================
    
    public static final String GAME_TYPE_PVP = "pvp";
    public static final String GAME_TYPE_BEDWARS = "bedwars";
    public static final String GAME_TYPE_CTF = "ctf";
    
    /**
     * All valid game types
     */
    public static final String[] GAME_TYPES = {
        GAME_TYPE_PVP,
        GAME_TYPE_BEDWARS,
        GAME_TYPE_CTF
    };
    
    // ==================== Tokens Per Team ====================
    // Note: These values should match the backend, but the backend is the source of truth
    
    public static final int PVP_TOKENS_PER_TEAM = 1;
    public static final int BEDWARS_TOKENS_PER_TEAM = 4;
    public static final int CTF_TOKENS_PER_TEAM = 5;
    
    /**
     * Get tokens per team for a game type
     * Note: The backend is the source of truth for this value
     */
    public static int getTokensPerTeam(String gameType) {
        switch (gameType) {
            case GAME_TYPE_PVP:
                return PVP_TOKENS_PER_TEAM;
            case GAME_TYPE_BEDWARS:
                return BEDWARS_TOKENS_PER_TEAM;
            case GAME_TYPE_CTF:
                return CTF_TOKENS_PER_TEAM;
            default:
                return 1; // Default to 1 for unknown types
        }
    }
    
    // ==================== Match Statuses ====================
    
    public static final String STATUS_QUEUING = "Queuing";
    public static final String STATUS_WAITING = "Waiting";
    public static final String STATUS_PLAYING = "Playing";
    public static final String STATUS_FINISHED = "Finished";
    public static final String STATUS_TERMINATED = "Terminated";
    
    /**
     * All valid match statuses
     */
    public static final String[] MATCH_STATUSES = {
        STATUS_QUEUING,
        STATUS_WAITING,
        STATUS_PLAYING,
        STATUS_FINISHED,
        STATUS_TERMINATED
    };
    
    /**
     * Check if a status is a terminal status (no further transitions)
     */
    public static boolean isTerminalStatus(String status) {
        return STATUS_FINISHED.equals(status) || STATUS_TERMINATED.equals(status);
    }
    
    // ==================== Match Modes ====================
    
    public static final String MODE_PRACTICE = "practice";
    public static final String MODE_RANKED = "ranked";
    
    /**
     * All valid match modes
     */
    public static final String[] MATCH_MODES = {
        MODE_PRACTICE,
        MODE_RANKED
    };
}
