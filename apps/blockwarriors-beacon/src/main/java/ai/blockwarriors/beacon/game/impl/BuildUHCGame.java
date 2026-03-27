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
 * Build UHC — 1v1 duel with building, bow, melee, and healing.
 *
 * Rules:
 * - Two players fight with sword, bow, rod, blocks, and golden apples
 * - Block placement is enabled up to a height limit
 * - First to kill the opponent wins the round
 * - If time expires, higher remaining health wins
 * - If health is tied at expiry, sudden death begins (30s, no healing)
 * - Disconnecting causes immediate forfeit
 * - Broken blocks drop nothing; only player-placed blocks can be broken
 */
public class BuildUHCGame extends BaseGame {

    private static final DisconnectPolicy DISCONNECT_POLICY = DisconnectPolicy.instantForfeit();
    private static final int COUNTDOWN_SECONDS = 5;
    private static final int TIME_LIMIT_SECONDS = 300;
    private static final int SUDDEN_DEATH_SECONDS = 30;
    private static final int BUILD_HEIGHT_LIMIT = 81; // floor Y(65) + 16

    private final Map<UUID, Integer> kills = new HashMap<>();
    private final Map<UUID, Integer> deaths = new HashMap<>();
    private final Map<UUID, Double> damageDealt = new HashMap<>();

    /** Locations of blocks placed by players during the match */
    private final Set<Long> playerPlacedBlocks = new HashSet<>();

    private BukkitTask countdownTask;
    private BukkitTask timerTask;
    private BukkitTask suddenDeathTask;
    private boolean pvpEnabled = false;
    private boolean suddenDeath = false;

    public BuildUHCGame(JavaPlugin plugin, String matchId) {
        super(plugin, GameConfig.GAME_TYPE_BUILD_UHC, matchId);
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

        loadArena();
        teleportToSpawns(blueTeamPlayers, redTeamPlayers);

        for (Player p : blueTeamPlayers) setupPlayer(p);
        for (Player p : redTeamPlayers) setupPlayer(p);

        setState(GameState.READY);
        LOGGER.info("Build UHC game initialized for match " + matchId);
    }

    @Override
    public void start() {
        if (state != GameState.READY) {
            LOGGER.warning("Cannot start Build UHC — not READY (current: " + state + ")");
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
            UUID killerId = killer.getUniqueId();
            kills.merge(killerId, 1, Integer::sum);
            winnerId = killerId;
            broadcastMessage("\u00a7c" + deadPlayer.getName() +
                    " \u00a77was killed by \u00a7a" + killer.getName());
        } else {
            List<UUID> opponents = getOpponents(deadId);
            if (!opponents.isEmpty()) {
                winnerId = opponents.get(0);
            }
            broadcastMessage("\u00a7c" + deadPlayer.getName() + " \u00a77died");
        }

        LOGGER.info("Player death in Build UHC match " + matchId + ": " + deadPlayer.getName() +
                (killer != null ? " killed by " + killer.getName() : " (environmental)"));

        return true;
    }

    @Override
    public boolean handleObjective(String objectiveType, Player player, Map<String, Object> data) {
        return false;
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
        state.put("suddenDeath", suddenDeath);
        state.put("durationMs", getDurationMillis());

        List<Map<String, Object>> playerStats = new ArrayList<>();
        for (UUID playerId : players) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("playerId", playerId.toString());
            stats.put("team", getTeamForPlayer(playerId));
            stats.put("kills", kills.getOrDefault(playerId, 0));
            stats.put("deaths", deaths.getOrDefault(playerId, 0));
            stats.put("damageDealt", damageDealt.getOrDefault(playerId, 0.0));
            stats.put("disconnected", isPlayerDisconnected(playerId));

            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                stats.put("health", player.getHealth());
                stats.put("hunger", player.getFoodLevel());
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
        if (timerTask != null && !timerTask.isCancelled()) timerTask.cancel();
        if (suddenDeathTask != null && !suddenDeathTask.isCancelled()) suddenDeathTask.cancel();
        pvpEnabled = false;

        for (UUID playerId : players) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                for (PotionEffect effect : player.getActivePotionEffects()) {
                    player.removePotionEffect(effect.getType());
                }
            }
        }

        playerPlacedBlocks.clear();
        LOGGER.info("Build UHC game cleanup for match " + matchId);
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

        LOGGER.info("Player " + playerId + " disconnected from Build UHC match " + matchId +
                " (reason: " + reason + ")");

        List<UUID> opponents = getOpponents(playerId);
        if (!opponents.isEmpty()) {
            winnerId = opponents.get(0);
            broadcastMessage("\u00a7c" + getPlayerName(playerId) +
                    " \u00a77disconnected. \u00a7aOpponent wins!");
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

    // ==================== Block Tracking ====================

    /**
     * Encode a block location into a single long for fast set lookup.
     */
    private static long encodeLocation(int x, int y, int z) {
        return ((long) x & 0x3FFFFFFL) << 38 | ((long) y & 0xFFFL) << 26 | ((long) z & 0x3FFFFFFL);
    }

    /**
     * Track a block placed by a player.
     */
    public void trackPlacedBlock(Location location) {
        playerPlacedBlocks.add(encodeLocation(
                location.getBlockX(), location.getBlockY(), location.getBlockZ()));
    }

    /**
     * Stop tracking a player-placed block (it was broken).
     */
    public void untrackPlacedBlock(Location location) {
        playerPlacedBlocks.remove(encodeLocation(
                location.getBlockX(), location.getBlockY(), location.getBlockZ()));
    }

    /**
     * Check if a block at the given location was placed by a player.
     */
    public boolean isPlayerPlacedBlock(Location location) {
        return playerPlacedBlocks.contains(encodeLocation(
                location.getBlockX(), location.getBlockY(), location.getBlockZ()));
    }

    // ==================== Public Accessors ====================

    public boolean isPvPEnabled() {
        return pvpEnabled;
    }

    public boolean isSuddenDeath() {
        return suddenDeath;
    }

    public int getBuildHeightLimit() {
        if (arenaConfig != null) {
            Object limit = arenaConfig.getObjective("build_height_limit");
            if (limit instanceof Number) {
                return ((Number) limit).intValue();
            }
        }
        return BUILD_HEIGHT_LIMIT;
    }

    // ==================== Player Setup ====================

    private void initPlayerStats(UUID playerId) {
        kills.put(playerId, 0);
        deaths.put(playerId, 0);
        damageDealt.put(playerId, 0.0);
    }

    private void teleportToSpawns(List<Player> bluePlayers, List<Player> redPlayers) {
        List<SpawnPoint> blueSpawns = null;
        List<SpawnPoint> redSpawns = null;

        if (arenaConfig != null) {
            blueSpawns = arenaConfig.getSpawns("blue_team");
            redSpawns = arenaConfig.getSpawns("red_team");
        }

        for (int i = 0; i < bluePlayers.size(); i++) {
            Player player = bluePlayers.get(i);
            Location spawnLoc;
            if (blueSpawns != null && i < blueSpawns.size()) {
                spawnLoc = blueSpawns.get(i).toLocation(world);
            } else {
                spawnLoc = new Location(world, 25, 65, 0, -90, 0);
            }
            player.teleport(spawnLoc);
        }

        for (int i = 0; i < redPlayers.size(); i++) {
            Player player = redPlayers.get(i);
            Location spawnLoc;
            if (redSpawns != null && i < redSpawns.size()) {
                spawnLoc = redSpawns.get(i).toLocation(world);
            } else {
                spawnLoc = new Location(world, -25, 65, 0, 90, 0);
            }
            player.teleport(spawnLoc);
        }
    }

    private void setupPlayer(Player player) {
        player.setGameMode(GameMode.SURVIVAL);
        player.getInventory().clear();

        // UHC loadout
        player.getInventory().addItem(new ItemStack(Material.IRON_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 32));
        player.getInventory().addItem(new ItemStack(Material.FISHING_ROD, 1));

        // Team-colored blocks
        String team = getTeamForPlayer(player.getUniqueId());
        Material blockMaterial = "blue".equals(team) ? Material.BLUE_CONCRETE : Material.RED_CONCRETE;
        player.getInventory().addItem(new ItemStack(blockMaterial, 64));

        // Healing and utility
        player.getInventory().addItem(new ItemStack(Material.GOLDEN_APPLE, 2));
        player.getInventory().addItem(new ItemStack(Material.WATER_BUCKET, 1));

        // Reset health and hunger
        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.setSaturation(20.0f);

        // Clear potion effects
        for (PotionEffect effect : player.getActivePotionEffects()) {
            player.removePotionEffect(effect.getType());
        }

        // Freeze during countdown
        player.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS,
                (COUNTDOWN_SECONDS + 1) * 20, 255, false, false));
        player.addPotionEffect(new PotionEffect(PotionEffectType.JUMP_BOOST,
                (COUNTDOWN_SECONDS + 1) * 20, 128, false, false));
    }

    // ==================== Game Flow ====================

    private void startCountdown() {
        countdownTask = new BukkitRunnable() {
            int countdown = COUNTDOWN_SECONDS;

            @Override
            public void run() {
                if (countdown > 0) {
                    broadcastTitle("\u00a7e" + countdown, "\u00a77Get ready to fight!");
                    playSound(Sound.BLOCK_NOTE_BLOCK_PLING, 1.0f);
                    countdown--;
                } else {
                    startTime = System.currentTimeMillis();
                    pvpEnabled = true;
                    setState(GameState.IN_PROGRESS);

                    broadcastTitle("\u00a7a\u00a7lFIGHT!", "");
                    playSound(Sound.ENTITY_ENDER_DRAGON_GROWL, 1.0f);

                    // Remove freeze effects
                    for (UUID playerId : players) {
                        Player player = Bukkit.getPlayer(playerId);
                        if (player != null && player.isOnline()) {
                            player.removePotionEffect(PotionEffectType.SLOWNESS);
                            player.removePotionEffect(PotionEffectType.JUMP_BOOST);
                        }
                    }

                    startMatchTimer();

                    LOGGER.info("Build UHC match " + matchId + " started!");
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    private void startMatchTimer() {
        int timeLimitSeconds = TIME_LIMIT_SECONDS;
        if (arenaConfig != null) {
            Object configLimit = arenaConfig.getObjective("time_limit_seconds");
            if (configLimit instanceof Number) {
                timeLimitSeconds = ((Number) configLimit).intValue();
            }
        }

        final int finalTimeLimit = timeLimitSeconds;

        timerTask = new BukkitRunnable() {
            int elapsed = 0;

            @Override
            public void run() {
                if (!isActive()) {
                    cancel();
                    return;
                }

                elapsed += 10;

                if (elapsed >= finalTimeLimit) {
                    onTimeExpired();
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 200L, 200L); // every 10 seconds
    }

    private void onTimeExpired() {
        double blueHealth = getTeamHealth("blue");
        double redHealth = getTeamHealth("red");

        if (blueHealth != redHealth) {
            winnerId = blueHealth > redHealth ? getFirstAlive(blueTeam) : getFirstAlive(redTeam);
            String winnerName = getPlayerName(winnerId);
            broadcastMessage("\u00a76\u00a7lTime's up! \u00a7a" + winnerName +
                    " \u00a77wins with more health!");
            endGame(winnerId);
        } else {
            enterSuddenDeath();
        }
    }

    private void enterSuddenDeath() {
        suddenDeath = true;
        broadcastMessage("\u00a7c\u00a7lSUDDEN DEATH! \u00a77No healing for 30 seconds!");
        playSound(Sound.ENTITY_WITHER_SPAWN, 1.0f);

        int sdSeconds = SUDDEN_DEATH_SECONDS;
        if (arenaConfig != null) {
            Object configSd = arenaConfig.getObjective("sudden_death_seconds");
            if (configSd instanceof Number) {
                sdSeconds = ((Number) configSd).intValue();
            }
        }

        final int finalSdSeconds = sdSeconds;
        suddenDeathTask = new BukkitRunnable() {
            int elapsed = 0;

            @Override
            public void run() {
                if (!isActive()) {
                    cancel();
                    return;
                }

                elapsed += 5;

                if (elapsed >= finalSdSeconds) {
                    // Sudden death expired — higher health wins, or draw
                    double blueHealth = getTeamHealth("blue");
                    double redHealth = getTeamHealth("red");

                    if (blueHealth > redHealth) {
                        winnerId = getFirstAlive(blueTeam);
                    } else if (redHealth > blueHealth) {
                        winnerId = getFirstAlive(redTeam);
                    } else {
                        winnerId = getFirstAlive(blueTeam); // tiebreak: blue wins
                    }

                    String winnerName = winnerId != null ? getPlayerName(winnerId) : "nobody";
                    broadcastMessage("\u00a76\u00a7lSudden death over! \u00a7a" +
                            winnerName + " \u00a77wins!");
                    endGame(winnerId);
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 100L, 100L); // every 5 seconds
    }

    // ==================== Helpers ====================

    private double getTeamHealth(String team) {
        List<UUID> teamPlayers = "blue".equals(team) ? blueTeam : redTeam;
        double total = 0;
        for (UUID playerId : teamPlayers) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                total += player.getHealth();
            }
        }
        return total;
    }

    private UUID getFirstAlive(List<UUID> team) {
        for (UUID playerId : team) {
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline() && player.getHealth() > 0) {
                return playerId;
            }
        }
        return !team.isEmpty() ? team.get(0) : null;
    }

    private String getPlayerName(UUID playerId) {
        if (playerId == null) return "unknown";
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

    // ==================== Arena Generation (fallback) ====================

    @Override
    protected void generateArena() {
        if (world == null) return;

        int floorY = 64;

        // Flat central area
        for (int x = -30; x <= 30; x++) {
            for (int z = -20; z <= 20; z++) {
                setBlock(x, floorY, z, Material.SMOOTH_STONE);
            }
        }

        // Symmetric cover structures — blue side
        buildCoverWall(15, floorY, -10);
        buildCoverWall(15, floorY, 10);

        // Symmetric cover structures — red side
        buildCoverWall(-15, floorY, -10);
        buildCoverWall(-15, floorY, 10);

        // Mid cover (smaller walls near center)
        buildSmallCover(0, floorY, -8);
        buildSmallCover(0, floorY, 8);

        LOGGER.info("Build UHC fallback arena generated for match " + matchId);
    }

    private void buildCoverWall(int x, int floorY, int z) {
        for (int dz = -2; dz <= 2; dz++) {
            setBlock(x, floorY + 1, z + dz, Material.STONE_BRICKS);
            setBlock(x, floorY + 2, z + dz, Material.STONE_BRICKS);
        }
        setBlock(x, floorY + 3, z, Material.STONE_BRICK_WALL);
    }

    private void buildSmallCover(int x, int floorY, int z) {
        for (int dz = -1; dz <= 1; dz++) {
            setBlock(x, floorY + 1, z + dz, Material.OAK_PLANKS);
            setBlock(x, floorY + 2, z + dz, Material.OAK_PLANKS);
        }
    }

    private void setBlock(int x, int y, int z, Material material) {
        Block block = world.getBlockAt(x, y, z);
        block.setType(material);
    }
}
