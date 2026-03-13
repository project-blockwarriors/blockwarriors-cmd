package ai.blockwarriors.beacon.constants;

/**
 * Generated from packages/shared/constants/game-config.json.
 * Run `npm run codegen:beacon` after updating shared game config.
 */
public final class GameConfig {

    private GameConfig() {
        // Prevent instantiation
    }

    // ==================== Game Types ====================

    public static final String GAME_TYPE_PVP = "pvp";
    public static final String GAME_TYPE_SKY_TILES = "sky_tiles";
    public static final String GAME_TYPE_WOOL_WARS = "wool_wars";
    public static final String GAME_TYPE_BRIDGE = "bridge";
    public static final String GAME_TYPE_BEDWARS = "bedwars";
    public static final String GAME_TYPE_CTF = "ctf";

    /**
     * All valid game types
     */
    public static final String[] GAME_TYPES = {
        GAME_TYPE_PVP,
        GAME_TYPE_SKY_TILES,
        GAME_TYPE_WOOL_WARS,
        GAME_TYPE_BRIDGE,
        GAME_TYPE_BEDWARS,
        GAME_TYPE_CTF
    };

    // ==================== Tokens Per Team ====================

    public static final int PVP_TOKENS_PER_TEAM = 1;
    public static final int SKY_TILES_TOKENS_PER_TEAM = 1;
    public static final int WOOL_WARS_TOKENS_PER_TEAM = 4;
    public static final int BRIDGE_TOKENS_PER_TEAM = 1;
    public static final int BEDWARS_TOKENS_PER_TEAM = 4;
    public static final int CTF_TOKENS_PER_TEAM = 5;

    /**
     * Get tokens per team for a game type.
     */
    public static int getTokensPerTeam(String gameType) {
        switch (gameType) {
            case GAME_TYPE_PVP:
                return PVP_TOKENS_PER_TEAM;
            case GAME_TYPE_SKY_TILES:
                return SKY_TILES_TOKENS_PER_TEAM;
            case GAME_TYPE_WOOL_WARS:
                return WOOL_WARS_TOKENS_PER_TEAM;
            case GAME_TYPE_BRIDGE:
                return BRIDGE_TOKENS_PER_TEAM;
            case GAME_TYPE_BEDWARS:
                return BEDWARS_TOKENS_PER_TEAM;
            case GAME_TYPE_CTF:
                return CTF_TOKENS_PER_TEAM;
            default:
                return 1;
        }
    }

    // ==================== Arena Defaults ====================

    /**
     * Get the default arena name for a game type.
     */
    public static String getDefaultArena(String gameType) {
        switch (gameType) {
            case GAME_TYPE_PVP:
                return "pvp";
            case GAME_TYPE_SKY_TILES:
                return "sky_tiles";
            case GAME_TYPE_WOOL_WARS:
                return "wool_wars";
            case GAME_TYPE_BRIDGE:
                return "bridge";
            case GAME_TYPE_BEDWARS:
                return "bedwars";
            case GAME_TYPE_CTF:
                return "ctf";
            default:
                return "pvp";
        }
    }

    /**
     * Check if a game type is valid.
     */
    public static boolean isValidGameType(String gameType) {
        for (String type : GAME_TYPES) {
            if (type.equals(gameType)) {
                return true;
            }
        }
        return false;
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
     * Check if a status is terminal.
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
