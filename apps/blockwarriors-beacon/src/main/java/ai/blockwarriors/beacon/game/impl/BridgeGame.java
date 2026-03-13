package ai.blockwarriors.beacon.game.impl;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.SpawnPoint;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.*;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.*;

/**
 * Bridge game — 1v1. Two platforms separated by void.
 * Enter opponent's goal zone to score. First to 5 wins.
 *
 * Arena layout (generated programmatically):
 * - Blue platform: x=[20..34], y=65, z=[-7..7]  (15x15)
 * - Red platform:  x=[-34..-20], y=65, z=[-7..7] (15x15)
 * - Void gap:      x=[-19..19]                    (25 blocks)
 * - Blue goal:     x=[32..34], z=[-1..1]           (3x3 at back of blue side)
 * - Red goal:      x=[-34..-32], z=[-1..1]         (3x3 at back of red side)
 *
 * Blue spawns on blue platform, must reach RED goal to score (and vice versa).
 */
public class BridgeGame extends BaseGame {

    private static final DisconnectPolicy DISCONNECT_POLICY = DisconnectPolicy.instantForfeit();
    private static final int COUNTDOWN_SECONDS = 5;
    private static final int SCORE_TO_WIN = 5;
    private static final int TIME_LIMIT_SECONDS = 300; // 5 minutes

    // Platform dimensions
    private static final int PLATFORM_SIZE = 15;     // 15x15 blocks
    private static final int PLATFORM_Y = 65;
    private static final int GAP_HALF = 12;           // void from -12 to 12
    private static final int BLUE_PLATFORM_X = 20;    // blue: 20..34
    private static final int RED_PLATFORM_X = -34;    // red: -34..-20
    private static final int PLATFORM_Z_MIN = -7;
    private static final int PLATFORM_Z_MAX = 7;

    // Goal zones (3x3 at the back of each platform)
    private static final int GOAL_DEPTH = 3;

    // Scores
    private final Map<String, Integer> scores = new HashMap<>();

    // Tracking
    private final Map<UUID, Integer> kills = new HashMap<>();
    private final Map<UUID, Integer> deaths = new HashMap<>();
    private final Map<UUID, Double> damageDealt = new HashMap<>();

    private BukkitTask countdownTask;
    private BukkitTask goalCheckTask;
    private BukkitTask timerTask;
    private boolean pvpEnabled = false;
    private boolean suddenDeath = false;

    public BridgeGame(JavaPlugin plugin, String matchId) {
        super(plugin, GameConfig.GAME_TYPE_BRIDGE, matchId);
        scores.put("blue", 0);
        scores.put("red", 0);
    }

    // ==================== Lifecycle ====================

    @Override
    public void initialize(World world, ArenaConfig arenaConfig,
                          List<Player> blueTeamPlayers, List<Player> redTeamPlayers) {
        this.world = world;
        this.arenaConfig = arenaConfig;

        for (Player p : blueTeamPlayers) {
            players.add(p.getUniqueId());
            blueTeam.add(p.getUniqueId());
            initPlayerStats(p.getUniqueId());
        }
        for (Player p : redTeamPlayers) {
            players.add(p.getUniqueId());
            redTeam.add(p.getUniqueId());
            initPlayerStats(p.getUniqueId());
        }

        // Generate arena
        generateArena();

        // Teleport and setup
        teleportToSpawns(blueTeamPlayers, redTeamPlayers);
        for (Player p : blueTeamPlayers) setupPlayer(p);
        for (Player p : redTeamPlayers) setupPlayer(p);

        setState(GameState.READY);
        LOGGER.info("Bridge game initialized for match " + matchId);
    }

    @Override
    public void start() {
        if (state != GameState.READY) {
            LOGGER.warning("Cannot start Bridge — not READY (current: " + state + ")");
            return;
        }

        if (world != null) {
            world.setDifficulty(org.bukkit.Difficulty.HARD);
        }

        setState(GameState.COUNTDOWN);
        startCountdown();
    }

    @Override
    public boolean handlePlayerDeath(Player deadPlayer, Player killer) {
        if (!isActive()) return false;

        UUID deadId = deadPlayer.getUniqueId();
        deaths.merge(deadId, 1, Integer::sum);

        if (killer != null) {
            kills.merge(killer.getUniqueId(), 1, Integer::sum);
            broadcastMessage("§c" + deadPlayer.getName() + " §7was killed by §a" + killer.getName());
        } else {
            broadcastMessage("§c" + deadPlayer.getName() + " §7fell into the void");
        }

        // Respawn at own platform after short delay
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            if (!isActive()) return;
            Player player = Bukkit.getPlayer(deadId);
            if (player != null && player.isOnline()) {
                respawnPlayer(player);
            }
        }, 40L); // 2 seconds

        return true;
    }

    @Override
    public boolean handleObjective(String objectiveType, Player player, Map<String, Object> data) {
        if (!"goal_scored".equals(objectiveType)) return false;

        String team = getTeamForPlayer(player.getUniqueId());
        if (team == null) return false;

        scores.merge(team, 1, Integer::sum);
        int score = scores.get(team);

        broadcastMessage("§6§l" + player.getName() + " §escored! §7[" +
                scores.get("blue") + " - " + scores.get("red") + "]");
        playSound(Sound.ENTITY_PLAYER_LEVELUP, 1.0f);

        if (score >= SCORE_TO_WIN || (suddenDeath && score > 0)) {
            winnerId = player.getUniqueId();
            return true;
        }

        // Reset positions
        resetPositions();
        return true;
    }

    @Override
    public boolean checkWinCondition() {
        return winnerId != null;
    }

    @Override
    public Map<String, Object> getGameState() {
        Map<String, Object> state = new HashMap<>();
        state.put("gameType", gameType);
        state.put("matchId", matchId);
        state.put("state", this.state.name());
        state.put("pvpEnabled", pvpEnabled);
        state.put("durationMs", getDurationMillis());
        state.put("blueScore", scores.get("blue"));
        state.put("redScore", scores.get("red"));
        state.put("suddenDeath", suddenDeath);

        List<Map<String, Object>> playerStats = new ArrayList<>();
        for (UUID playerId : players) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("playerId", playerId.toString());
            stats.put("team", getTeamForPlayer(playerId));
            stats.put("kills", kills.getOrDefault(playerId, 0));
            stats.put("deaths", deaths.getOrDefault(playerId, 0));
            stats.put("damageDealt", damageDealt.getOrDefault(playerId, 0.0));

            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                stats.put("health", player.getHealth());
            }

            playerStats.add(stats);
        }
        state.put("players", playerStats);

        if (winnerId != null) {
            state.put("winnerId", winnerId.toString());
        }

        return state;
    }

    @Override
    public void cleanup() {
        if (countdownTask != null && !countdownTask.isCancelled()) countdownTask.cancel();
        if (goalCheckTask != null && !goalCheckTask.isCancelled()) goalCheckTask.cancel();
        if (timerTask != null && !timerTask.isCancelled()) timerTask.cancel();
        pvpEnabled = false;

        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                for (PotionEffect effect : player.getActivePotionEffects()) {
                    player.removePotionEffect(effect.getType());
                }
            }
        }

        LOGGER.info("Bridge game cleanup for match " + matchId);
    }

    @Override
    public void handleDamage(Player damager, Player target, double damage) {
        if (isActive() && pvpEnabled) {
            damageDealt.merge(damager.getUniqueId(), damage, Double::sum);
        }
    }

    // ==================== Disconnect ====================

    @Override
    public DisconnectResult handlePlayerDisconnect(UUID playerId, DisconnectReason reason) {
        if (!hasPlayer(playerId)) return null;

        List<UUID> opponents = getOpponents(playerId);
        if (!opponents.isEmpty()) {
            winnerId = opponents.get(0);
            broadcastMessage("§c" + getPlayerName(playerId) + " §7disconnected. §aOpponent wins!");
        }

        disconnectedPlayers.put(playerId, System.currentTimeMillis());
        return DisconnectResult.FORFEIT;
    }

    @Override
    public boolean handlePlayerReconnect(UUID playerId) {
        return false;
    }

    @Override
    public DisconnectPolicy getDisconnectPolicy() {
        return DISCONNECT_POLICY;
    }

    // ==================== Arena Generation ====================

    private void generateArena() {
        if (world == null) return;

        // Blue platform
        fillPlatform(BLUE_PLATFORM_X, PLATFORM_Y, PLATFORM_Z_MIN,
                BLUE_PLATFORM_X + PLATFORM_SIZE - 1, PLATFORM_Z_MAX, Material.BLUE_CONCRETE);

        // Blue goal zone (3x3 at back — highest X values)
        fillGoal(BLUE_PLATFORM_X + PLATFORM_SIZE - GOAL_DEPTH, PLATFORM_Y + 1,
                -1, BLUE_PLATFORM_X + PLATFORM_SIZE - 1, 1, Material.BLUE_STAINED_GLASS);

        // Red platform
        fillPlatform(RED_PLATFORM_X, PLATFORM_Y, PLATFORM_Z_MIN,
                RED_PLATFORM_X + PLATFORM_SIZE - 1, PLATFORM_Z_MAX, Material.RED_CONCRETE);

        // Red goal zone (3x3 at back — lowest X values)
        fillGoal(RED_PLATFORM_X, PLATFORM_Y + 1,
                -1, RED_PLATFORM_X + GOAL_DEPTH - 1, 1, Material.RED_STAINED_GLASS);

        // Side walls (1-high) on both platforms
        for (int x = RED_PLATFORM_X; x <= BLUE_PLATFORM_X + PLATFORM_SIZE - 1; x++) {
            // Only place walls on the platforms, not in the void
            if ((x >= RED_PLATFORM_X && x <= RED_PLATFORM_X + PLATFORM_SIZE - 1) ||
                (x >= BLUE_PLATFORM_X && x <= BLUE_PLATFORM_X + PLATFORM_SIZE - 1)) {
                setBlock(x, PLATFORM_Y + 1, PLATFORM_Z_MIN, Material.STONE_BRICK_WALL);
                setBlock(x, PLATFORM_Y + 1, PLATFORM_Z_MAX, Material.STONE_BRICK_WALL);
            }
        }

        LOGGER.info("Bridge arena generated");
    }

    private void fillPlatform(int x1, int y, int z1, int x2, int z2, Material material) {
        for (int x = x1; x <= x2; x++) {
            for (int z = z1; z <= z2; z++) {
                setBlock(x, y, z, material);
            }
        }
    }

    private void fillGoal(int x1, int y, int z1, int x2, int z2, Material material) {
        for (int x = x1; x <= x2; x++) {
            for (int z = z1; z <= z2; z++) {
                setBlock(x, y, z, material);
            }
        }
    }

    private void setBlock(int x, int y, int z, Material material) {
        Block block = world.getBlockAt(x, y, z);
        block.setType(material);
    }

    // ==================== Player Management ====================

    private void initPlayerStats(UUID playerId) {
        kills.put(playerId, 0);
        deaths.put(playerId, 0);
        damageDealt.put(playerId, 0.0);
    }

    private void teleportToSpawns(List<Player> bluePlayers, List<Player> redPlayers) {
        for (Player p : bluePlayers) {
            p.teleport(getBlueSpawn());
        }
        for (Player p : redPlayers) {
            p.teleport(getRedSpawn());
        }
    }

    private Location getBlueSpawn() {
        // Center of blue platform, facing toward red side (west)
        return new Location(world, BLUE_PLATFORM_X + PLATFORM_SIZE / 2.0, PLATFORM_Y + 1, 0, -90, 0);
    }

    private Location getRedSpawn() {
        // Center of red platform, facing toward blue side (east)
        return new Location(world, RED_PLATFORM_X + PLATFORM_SIZE / 2.0, PLATFORM_Y + 1, 0, 90, 0);
    }

    private void setupPlayer(Player player) {
        player.setGameMode(GameMode.SURVIVAL);
        player.getInventory().clear();

        // Loadout
        player.getInventory().addItem(new ItemStack(Material.STONE_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 16));
        player.getInventory().addItem(new ItemStack(Material.IRON_BOOTS, 1));

        // Team-colored blocks
        String team = getTeamForPlayer(player.getUniqueId());
        Material blockMaterial = "blue".equals(team) ? Material.BLUE_CONCRETE : Material.RED_CONCRETE;
        player.getInventory().addItem(new ItemStack(blockMaterial, 64));

        // Equip iron boots
        player.getInventory().setBoots(new ItemStack(Material.IRON_BOOTS, 1));

        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.setSaturation(20.0f);

        for (PotionEffect effect : player.getActivePotionEffects()) {
            player.removePotionEffect(effect.getType());
        }

        // Freeze during countdown
        player.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS,
                (COUNTDOWN_SECONDS + 1) * 20, 255, false, false));
        player.addPotionEffect(new PotionEffect(PotionEffectType.JUMP_BOOST,
                (COUNTDOWN_SECONDS + 1) * 20, 128, false, false));
    }

    private void respawnPlayer(Player player) {
        UUID playerId = player.getUniqueId();
        String team = getTeamForPlayer(playerId);
        if (team == null) return;

        Location spawn = "blue".equals(team) ? getBlueSpawn() : getRedSpawn();
        player.teleport(spawn);
        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.setSaturation(20.0f);

        // Restore loadout
        player.getInventory().clear();
        player.getInventory().addItem(new ItemStack(Material.STONE_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 16));
        Material blockMaterial = "blue".equals(team) ? Material.BLUE_CONCRETE : Material.RED_CONCRETE;
        player.getInventory().addItem(new ItemStack(blockMaterial, 64));
        player.getInventory().setBoots(new ItemStack(Material.IRON_BOOTS, 1));
    }

    private void resetPositions() {
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                respawnPlayer(player);
            }
        }
    }

    // ==================== Game Flow ====================

    private void startCountdown() {
        countdownTask = new BukkitRunnable() {
            int countdown = COUNTDOWN_SECONDS;

            @Override
            public void run() {
                if (countdown > 0) {
                    broadcastTitle("§e" + countdown, "§7Get ready!");
                    playSound(Sound.BLOCK_NOTE_BLOCK_PLING, 1.0f);
                    countdown--;
                } else {
                    startTime = System.currentTimeMillis();
                    pvpEnabled = true;
                    setState(GameState.IN_PROGRESS);

                    broadcastTitle("§a§lGO!", "§7Score by entering the enemy goal!");
                    playSound(Sound.ENTITY_ENDER_DRAGON_GROWL, 1.0f);

                    // Remove freeze
                    for (UUID playerId : players) {
                        Player player = Bukkit.getPlayer(playerId);
                        if (player != null && player.isOnline()) {
                            player.removePotionEffect(PotionEffectType.SLOWNESS);
                            player.removePotionEffect(PotionEffectType.JUMP_BOOST);
                        }
                    }

                    // Start goal check
                    startGoalCheck();

                    // Start timer
                    startTimer();

                    LOGGER.info("Bridge match " + matchId + " started!");
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    private void startGoalCheck() {
        goalCheckTask = new BukkitRunnable() {
            @Override
            public void run() {
                if (!isActive()) {
                    cancel();
                    return;
                }

                for (UUID playerId : players) {
                    Player player = Bukkit.getPlayer(playerId);
                    if (player == null || !player.isOnline()) continue;

                    String team = getTeamForPlayer(playerId);
                    if (team == null) continue;

                    Location loc = player.getLocation();
                    int px = loc.getBlockX();
                    int pz = loc.getBlockZ();

                    // Blue team scores by entering RED goal zone
                    // Red goal: x in [-34..-32], z in [-1..1]
                    if ("blue".equals(team) && isInRedGoal(px, pz)) {
                        handleObjective("goal_scored", player, Collections.emptyMap());
                        if (checkWinCondition()) {
                            endGame(winnerId);
                        }
                        return;
                    }

                    // Red team scores by entering BLUE goal zone
                    // Blue goal: x in [32..34], z in [-1..1]
                    if ("red".equals(team) && isInBlueGoal(px, pz)) {
                        handleObjective("goal_scored", player, Collections.emptyMap());
                        if (checkWinCondition()) {
                            endGame(winnerId);
                        }
                        return;
                    }
                }
            }
        }.runTaskTimer(plugin, 0L, 10L); // Every 0.5 seconds
    }

    private boolean isInRedGoal(int x, int z) {
        return x >= RED_PLATFORM_X && x <= RED_PLATFORM_X + GOAL_DEPTH - 1
                && z >= -1 && z <= 1;
    }

    private boolean isInBlueGoal(int x, int z) {
        return x >= BLUE_PLATFORM_X + PLATFORM_SIZE - GOAL_DEPTH && x <= BLUE_PLATFORM_X + PLATFORM_SIZE - 1
                && z >= -1 && z <= 1;
    }

    private void startTimer() {
        timerTask = new BukkitRunnable() {
            int elapsed = 0;

            @Override
            public void run() {
                if (!isActive()) {
                    cancel();
                    return;
                }

                elapsed += 10;

                if (elapsed >= TIME_LIMIT_SECONDS) {
                    // Time's up — check scores
                    int blueScore = scores.get("blue");
                    int redScore = scores.get("red");

                    if (blueScore != redScore) {
                        // Higher score wins
                        if (blueScore > redScore && !blueTeam.isEmpty()) {
                            winnerId = blueTeam.get(0);
                        } else if (!redTeam.isEmpty()) {
                            winnerId = redTeam.get(0);
                        }
                        endGame(winnerId);
                    } else {
                        // Tied — sudden death
                        suddenDeath = true;
                        broadcastMessage("§c§lSUDDEN DEATH! §7Next goal wins!");
                        playSound(Sound.ENTITY_WITHER_SPAWN, 1.0f);
                    }
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 200L, 200L); // Every 10 seconds
    }

    // ==================== Helpers ====================

    private String getPlayerName(UUID playerId) {
        Player player = Bukkit.getPlayer(playerId);
        return player != null ? player.getName() : playerId.toString().substring(0, 8);
    }

    private void broadcastMessage(String message) {
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                player.sendMessage(message);
            }
        }
    }

    private void broadcastTitle(String title, String subtitle) {
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                player.sendTitle(title, subtitle, 5, 20, 5);
            }
        }
    }

    private void playSound(Sound sound, float pitch) {
        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                player.playSound(player.getLocation(), sound, 1.0f, pitch);
            }
        }
    }

    // ==================== Public ====================

    public boolean isPvPEnabled() {
        return pvpEnabled;
    }

    public int getScore(String team) {
        return scores.getOrDefault(team, 0);
    }
}
