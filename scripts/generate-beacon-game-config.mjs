import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const configPath = path.join(
  rootDir,
  "packages",
  "shared",
  "constants",
  "game-config.json"
);
const outputPath = path.join(
  rootDir,
  "apps",
  "blockwarriors-beacon",
  "src",
  "main",
  "java",
  "ai",
  "blockwarriors",
  "beacon",
  "constants",
  "GameConfig.java"
);

const config = JSON.parse(readFileSync(configPath, "utf8"));
const gameTypes = Object.values(config.gameTypes);
const matchStatuses = config.matchStatuses;
const matchModes = Object.values(config.matchModes);

function toConstantName(value) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

const gameTypeConstants = gameTypes
  .map(({ id }) => `    public static final String GAME_TYPE_${toConstantName(id)} = "${id}";`)
  .join("\n");

const gameTypeArray = gameTypes
  .map(({ id }) => `        GAME_TYPE_${toConstantName(id)}`)
  .join(",\n");

const tokenConstants = gameTypes
  .map(
    ({ id, tokensPerTeam }) =>
      `    public static final int ${toConstantName(id)}_TOKENS_PER_TEAM = ${tokensPerTeam};`
  )
  .join("\n");

const tokenCases = gameTypes
  .map(
    ({ id }) =>
      `            case GAME_TYPE_${toConstantName(id)}:\n                return ${toConstantName(id)}_TOKENS_PER_TEAM;`
  )
  .join("\n");

const arenaCases = gameTypes
  .map(
    ({ id, defaultArena }) =>
      `            case GAME_TYPE_${toConstantName(id)}:\n                return "${defaultArena}";`
  )
  .join("\n");

const statusConstants = matchStatuses
  .map(
    (status) =>
      `    public static final String STATUS_${toConstantName(status)} = "${status}";`
  )
  .join("\n");

const statusArray = matchStatuses
  .map((status) => `        STATUS_${toConstantName(status)}`)
  .join(",\n");

const modeConstants = matchModes
  .map(({ id }) => `    public static final String MODE_${toConstantName(id)} = "${id}";`)
  .join("\n");

const modeArray = matchModes
  .map(({ id }) => `        MODE_${toConstantName(id)}`)
  .join(",\n");

const javaSource = `package ai.blockwarriors.beacon.constants;

/**
 * Generated from packages/shared/constants/game-config.json.
 * Run \`npm run codegen:beacon\` after updating shared game config.
 */
public final class GameConfig {

    private GameConfig() {
        // Prevent instantiation
    }

    // ==================== Game Types ====================

${gameTypeConstants}

    /**
     * All valid game types
     */
    public static final String[] GAME_TYPES = {
${gameTypeArray}
    };

    // ==================== Tokens Per Team ====================

${tokenConstants}

    /**
     * Get tokens per team for a game type.
     */
    public static int getTokensPerTeam(String gameType) {
        switch (gameType) {
${tokenCases}
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
${arenaCases}
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

${statusConstants}

    /**
     * All valid match statuses
     */
    public static final String[] MATCH_STATUSES = {
${statusArray}
    };

    /**
     * Check if a status is terminal.
     */
    public static boolean isTerminalStatus(String status) {
        return STATUS_FINISHED.equals(status) || STATUS_TERMINATED.equals(status);
    }

    // ==================== Match Modes ====================

${modeConstants}

    /**
     * All valid match modes
     */
    public static final String[] MATCH_MODES = {
${modeArray}
    };
}
`;

writeFileSync(outputPath, javaSource);
