package ai.blockwarriors.beacon.game.impl;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.SpawnPoint;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.*;
import ai.blockwarriors.beacon.game.kit.Archetype;
import ai.blockwarriors.beacon.game.kit.KitDefinition;
import ai.blockwarriors.beacon.game.kit.KitSelectionGUI;
import ai.blockwarriors.beacon.game.scoring.PointTracker;
import ai.blockwarriors.beacon.game.scoring.PointTracker.PointAction;

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
    private static final int KIT_SELECTION_SECONDS = 10;
    private static final int COUNTDOWN_SECONDS = 5;
    private static final int TIME_LIMIT_SECONDS = 300;
    private static final int SUDDEN_DEATH_SECONDS = 30;
    private static final int BUILD_HEIGHT_LIMIT = 81; // floor Y(65) + 16

    private final Map<UUID, Integer> kills = new HashMap<>();
    private final Map<UUID, Integer> deaths = new HashMap<>();
    private final Map<UUID, Double> damageDealt = new HashMap<>();

    /** Locations of blocks placed by players during the match */
    private final Set<Long> playerPlacedBlocks = new HashSet<>();

    /** Archetype selected by each player */
    private final Map<UUID, Archetype> playerArchetypes = new HashMap<>();

    private final PointTracker pointTracker = new PointTracker();
    private KitSelectionGUI kitSelectionGUI;

    private BukkitTask kitSelectionTask;
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

        // Prepare players (survival mode, clear inv, freeze) but don't give kit yet
        for (Player p : blueTeamPlayers) preparePlayer(p);
        for (Player p : redTeamPlayers) preparePlayer(p);

        // Open the kit selection chest for every player
        int teamSize = Math.max(blueTeamPlayers.size(), redTeamPlayers.size());
        kitSelectionGUI = new KitSelectionGUI(blueTeam, redTeam, teamSize);
        for (Player p : blueTeamPlayers) kitSelectionGUI.openFor(p);
        for (Player p : redTeamPlayers) kitSelectionGUI.openFor(p);

        setState(GameState.READY);
        LOGGER.info("Build UHC game initialized for match " + matchId);
    }

    @Override
    public void start() {
        if (state != GameState.READY) {
            LOGGER.warning("Cannot start Build UHC — not READY (current: " + state + ")");
            return;
        }

        // Re-open kit selection for any player whose GUI was closed by the
        // initialize -> start transition (they fire on the same tick).
        if (kitSelectionGUI != null) {
            for (UUID playerId : players) {
                if (!kitSelectionGUI.hasSelected(playerId)) {
                    Player p = Bukkit.getPlayer(playerId);
                    if (p != null && p.isOnline()) {
                        kitSelectionGUI.openFor(p);
                    }
                }
            }
        }

        broadcastMessage("\u00a7d\u00a7lSelect your kit! \u00a77You have \u00a7e"
                + KIT_SELECTION_SECONDS + " seconds\u00a77.");

        // Kit selection phase — give players time to pick, then start countdown
        kitSelectionTask = new BukkitRunnable() {
            int remaining = KIT_SELECTION_SECONDS;

            @Override
            public void run() {
                if (remaining > 0) {
                    if (remaining <= 5) {
                        broadcastMessage("\u00a7eKit selection closes in \u00a7c" + remaining + "s\u00a7e...");
                    }
                    remaining--;
                } else {
                    applyKitsAndStartCountdown();
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    /**
     * Called after the kit selection window closes. Applies kits and begins the
     * fight countdown.
     */
    private void applyKitsAndStartCountdown() {
        if (kitSelectionGUI != null) {
            kitSelectionGUI.closeAll();
        }

        for (UUID playerId : players) {
            Archetype arch = kitSelectionGUI != null
                    ? kitSelectionGUI.getSelection(playerId)
                    : Archetype.FIGHTER;
            playerArchetypes.put(playerId, arch);

            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                String team = getTeamForPlayer(playerId);
                KitDefinition.applyKit(player, arch, team);
                freezePlayer(player);

                String msg = kitSelectionGUI != null && kitSelectionGUI.hasSelected(playerId)
                        ? "\u00a7aKit locked: \u00a76" + arch.getDisplayName()
                        : "\u00a7eNo kit selected \u2014 defaulting to \u00a76Fighter\u00a7e.";
                player.sendMessage(msg);
            }
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
            pointTracker.addPoints(killerId, PointAction.KILL, 1.0);
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
            stats.put("points", pointTracker.getPoints(playerId));
            stats.put("disconnected", isPlayerDisconnected(playerId));

            Archetype arch = playerArchetypes.get(playerId);
            if (arch != null) {
                stats.put("archetype", arch.name());
            }

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
        if (kitSelectionTask != null && !kitSelectionTask.isCancelled()) kitSelectionTask.cancel();
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

        if (kitSelectionGUI != null) {
            kitSelectionGUI.closeAll();
        }
        playerPlacedBlocks.clear();
        LOGGER.info("Build UHC game cleanup for match " + matchId);
    }

    @Override
    public void handleDamage(Player damager, Player target, double damage) {
        if (isActive() && pvpEnabled) {
            damageDealt.merge(damager.getUniqueId(), damage, Double::sum);
            pointTracker.addPoints(damager.getUniqueId(), PointAction.DAMAGE, damage);
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

    /**
     * Get the kit selection GUI (used by MatchEventListener for click delegation).
     */
    public KitSelectionGUI getKitSelectionGUI() {
        return kitSelectionGUI;
    }

    /**
     * Get the point tracker for this match.
     */
    public PointTracker getPointTracker() {
        return pointTracker;
    }

    // ==================== Player Setup ====================

    private void initPlayerStats(UUID playerId) {
        kills.put(playerId, 0);
        deaths.put(playerId, 0);
        damageDealt.put(playerId, 0.0);
        pointTracker.registerPlayer(playerId);
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

    /**
     * Put the player in survival mode, clear inventory, reset health, and freeze.
     * The actual kit is applied later in {@link #start()} after kit selection.
     */
    private void preparePlayer(Player player) {
        player.setGameMode(GameMode.SURVIVAL);
        player.getInventory().clear();
        player.getInventory().setArmorContents(null);
        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.setSaturation(20.0f);

        for (PotionEffect effect : player.getActivePotionEffects()) {
            player.removePotionEffect(effect.getType());
        }

        // Freeze for the entire kit-selection + countdown window
        freezePlayer(player, KIT_SELECTION_SECONDS + COUNTDOWN_SECONDS + 2);
    }

    private void freezePlayer(Player player) {
        freezePlayer(player, COUNTDOWN_SECONDS + 1);
    }

    private void freezePlayer(Player player, int seconds) {
        int ticks = seconds * 20;
        player.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS,
                ticks, 255, false, false));
        player.addPotionEffect(new PotionEffect(PotionEffectType.JUMP_BOOST,
                ticks, 128, false, false));
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

        int y = 64;

        // --- Ground layers ---
        for (int x = -30; x <= 30; x++) {
            for (int z = -20; z <= 20; z++) {
                // Sub-floor (fill beneath so it doesn't look hollow)
                setBlock(x, y - 1, z, Material.STONE);

                double dist = Math.sqrt(x * x + z * z);

                // Team-coloured spawn platforms
                if (x >= 20 && x <= 28 && Math.abs(z) <= 4) {
                    setBlock(x, y, z, Material.BLUE_CONCRETE);
                } else if (x <= -20 && x >= -28 && Math.abs(z) <= 4) {
                    setBlock(x, y, z, Material.RED_CONCRETE);
                }
                // Central ring
                else if (dist <= 5) {
                    setBlock(x, y, z, Material.POLISHED_DEEPSLATE);
                }
                // Main lane (stone bricks along z=0 corridor)
                else if (Math.abs(z) <= 2) {
                    setBlock(x, y, z, Material.STONE_BRICKS);
                }
                // Decorative path edges
                else if (Math.abs(z) == 3) {
                    setBlock(x, y, z, Material.POLISHED_ANDESITE);
                }
                // Grassy flanking areas
                else if (Math.abs(z) <= 12) {
                    setBlock(x, y, z, Material.MOSS_BLOCK);
                }
                // Outer stone border
                else {
                    setBlock(x, y, z, Material.SMOOTH_STONE);
                }
            }
        }

        // --- Raised centre platform (2-high, 5x5) ---
        for (int x = -2; x <= 2; x++) {
            for (int z = -2; z <= 2; z++) {
                setBlock(x, y + 1, z, Material.POLISHED_DEEPSLATE);
            }
        }
        // Centre pillar/beacon-look
        setBlock(0, y + 2, 0, Material.SEA_LANTERN);

        // --- Spawn platforms (slightly raised, with walls behind) ---
        buildSpawnPlatform(24, y, Material.BLUE_CONCRETE, Material.BLUE_STAINED_GLASS, true);
        buildSpawnPlatform(-24, y, Material.RED_CONCRETE, Material.RED_STAINED_GLASS, false);

        // --- Cover structures (symmetric, varied) ---
        // Inner cover — angled stone brick walls near mid
        buildLShapedCover(8, y, -6, true);
        buildLShapedCover(8, y, 6, true);
        buildLShapedCover(-8, y, -6, false);
        buildLShapedCover(-8, y, 6, false);

        // Outer cover — tall pillars with slabs
        buildPillarCover(16, y, -9);
        buildPillarCover(16, y, 9);
        buildPillarCover(-16, y, -9);
        buildPillarCover(-16, y, 9);

        // Flank cover — low oak walls on the grassy sides
        buildFlankWall(12, y, -14);
        buildFlankWall(12, y, 14);
        buildFlankWall(-12, y, -14);
        buildFlankWall(-12, y, 14);

        // --- Boundary walls (3 high, decorative) ---
        for (int x = -30; x <= 30; x++) {
            for (int h = 1; h <= 3; h++) {
                setBlock(x, y + h, -20, Material.DARK_OAK_PLANKS);
                setBlock(x, y + h, 20, Material.DARK_OAK_PLANKS);
            }
        }
        for (int z = -20; z <= 20; z++) {
            for (int h = 1; h <= 3; h++) {
                setBlock(-30, y + h, z, Material.DARK_OAK_PLANKS);
                setBlock(30, y + h, z, Material.DARK_OAK_PLANKS);
            }
        }
        // Fence-post tops on boundaries
        for (int x = -30; x <= 30; x += 3) {
            setBlock(x, y + 4, -20, Material.DARK_OAK_FENCE);
            setBlock(x, y + 4, 20, Material.DARK_OAK_FENCE);
        }
        for (int z = -20; z <= 20; z += 3) {
            setBlock(-30, y + 4, z, Material.DARK_OAK_FENCE);
            setBlock(30, y + 4, z, Material.DARK_OAK_FENCE);
        }

        // --- Corner lanterns ---
        setBlock(-29, y + 4, -19, Material.LANTERN);
        setBlock(-29, y + 4, 19, Material.LANTERN);
        setBlock(29, y + 4, -19, Material.LANTERN);
        setBlock(29, y + 4, 19, Material.LANTERN);

        LOGGER.info("Build UHC arena generated for match " + matchId);
    }

    private void buildSpawnPlatform(int cx, int y, Material floor, Material glass, boolean isBlue) {
        // Raised 1-block platform
        for (int dx = -2; dx <= 2; dx++) {
            for (int dz = -2; dz <= 2; dz++) {
                setBlock(cx + dx, y + 1, dz, floor);
            }
        }
        // Back wall with glass window
        int backX = isBlue ? cx + 3 : cx - 3;
        for (int dz = -2; dz <= 2; dz++) {
            setBlock(backX, y + 2, dz, floor);
            setBlock(backX, y + 3, dz, Math.abs(dz) <= 1 ? glass : floor);
            setBlock(backX, y + 4, dz, floor);
        }
    }

    private void buildLShapedCover(int x, int y, int z, boolean mirrorX) {
        // L-shaped wall for interesting angles
        for (int dz = -1; dz <= 1; dz++) {
            setBlock(x, y + 1, z + dz, Material.STONE_BRICKS);
            setBlock(x, y + 2, z + dz, Material.STONE_BRICKS);
        }
        int wingX = mirrorX ? x - 1 : x + 1;
        setBlock(wingX, y + 1, z, Material.STONE_BRICKS);
        setBlock(wingX, y + 2, z, Material.STONE_BRICKS);
        setBlock(x, y + 3, z, Material.STONE_BRICK_WALL);
    }

    private void buildPillarCover(int x, int y, int z) {
        // 3-high pillar with slab cap
        setBlock(x, y + 1, z, Material.DEEPSLATE_BRICKS);
        setBlock(x, y + 2, z, Material.DEEPSLATE_BRICKS);
        setBlock(x, y + 3, z, Material.DEEPSLATE_BRICKS);
        setBlock(x, y + 4, z, Material.DEEPSLATE_BRICK_SLAB);
        // Flanking low walls
        setBlock(x, y + 1, z - 1, Material.DEEPSLATE_BRICK_WALL);
        setBlock(x, y + 1, z + 1, Material.DEEPSLATE_BRICK_WALL);
    }

    private void buildFlankWall(int x, int y, int z) {
        for (int dx = -1; dx <= 1; dx++) {
            setBlock(x + dx, y + 1, z, Material.OAK_LOG);
            setBlock(x + dx, y + 2, z, Material.OAK_PLANKS);
        }
        setBlock(x, y + 3, z, Material.OAK_FENCE);
    }

    private void setBlock(int x, int y, int z, Material material) {
        Block block = world.getBlockAt(x, y, z);
        block.setType(material);
    }
}
