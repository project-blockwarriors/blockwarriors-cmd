package ai.blockwarriors.beacon.game.impl;

import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.SpawnPoint;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.*;

import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.LeatherArmorMeta;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.*;

/**
 * Capture the Flag — 4v4.
 *
 * Two teams of 4 on a 50x50 symmetric map. Each base has a flag.
 * Pick up enemy flag, carry it to your base to score.
 * First to 3 captures wins, or most after 8 minutes.
 *
 * Arena layout (generated programmatically):
 * - Map: x=[-25..25], z=[-25..25], y=65 (stone floor)
 * - Blue base: x=[16..24], z=[-4..4] (walled area with flag at x=21, z=0)
 * - Red base:  x=[-24..-16], z=[-4..4] (walled area with flag at x=-21, z=0)
 * - Mid walls for cover at x=[-8..8] (cobblestone/stone bricks)
 */
public class CTFGame extends BaseGame {

    private static final int COUNTDOWN_SECONDS = 10;
    private static final int CAPTURES_TO_WIN = 3;
    private static final int TIME_LIMIT_SECONDS = 480; // 8 minutes
    private static final int RESPAWN_SECONDS = 5;
    private static final int GRACE_PERIOD_SECONDS = 30;
    private static final int MIN_PLAYERS_BEFORE_FORFEIT = 2;

    // Arena dimensions (reduced from 80x80 to 50x50 to avoid tick lag with 8 players)
    private static final int MAP_HALF = 25;
    private static final int FLOOR_Y = 65;

    // Base positions
    private static final int BLUE_BASE_X = 20;
    private static final int RED_BASE_X = -20;
    private static final int BLUE_FLAG_X = 21;
    private static final int RED_FLAG_X = -21;

    /** Flag state tracking. */
    private static class FlagState {
        enum Status { AT_BASE, CARRIED, DROPPED }

        Status status = Status.AT_BASE;
        Location baseLocation;
        Location currentLocation;
        UUID carrier;

        FlagState(Location baseLocation) {
            this.baseLocation = baseLocation;
            this.currentLocation = baseLocation.clone();
        }

        void returnToBase() {
            status = Status.AT_BASE;
            currentLocation = baseLocation.clone();
            carrier = null;
        }

        void pickup(UUID playerId) {
            status = Status.CARRIED;
            carrier = playerId;
        }

        void drop(Location location) {
            status = Status.DROPPED;
            currentLocation = location.clone();
            carrier = null;
        }
    }

    private final Map<String, Integer> captures = new HashMap<>();
    private final Map<UUID, Integer> kills = new HashMap<>();
    private final Map<UUID, Integer> deaths = new HashMap<>();
    private final Map<UUID, Double> damageDealt = new HashMap<>();
    private final Map<UUID, Long> respawnTimers = new HashMap<>();

    private FlagState blueFlag;
    private FlagState redFlag;

    private BukkitTask countdownTask;
    private BukkitTask gameLoopTask;
    private BukkitTask timerTask;
    private boolean pvpEnabled = false;

    public CTFGame(JavaPlugin plugin, String matchId) {
        super(plugin, GameConfig.GAME_TYPE_CTF, matchId);
        captures.put("blue", 0);
        captures.put("red", 0);
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

        // Initialize flags
        blueFlag = new FlagState(new Location(world, BLUE_FLAG_X, FLOOR_Y + 1, 0));
        redFlag = new FlagState(new Location(world, RED_FLAG_X, FLOOR_Y + 1, 0));

        // Load arena (schematic if available, else programmatic generation)
        loadArena();

        // Stagger teleports to avoid overwhelming the server with chunk loading.
        // Teleport one player every 10 ticks (0.5s) to spread the chunk-send load.
        // The 10-second countdown gives enough time for all 8 teleports to complete.
        for (int i = 0; i < blueTeamPlayers.size(); i++) {
            final Player p = blueTeamPlayers.get(i);
            final int idx = i;
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                Location[] spawns = getBlueSpawns();
                p.teleport(spawns[idx % spawns.length]);
                setupPlayer(p, "blue");
            }, (long) i * 20);
        }
        for (int i = 0; i < redTeamPlayers.size(); i++) {
            final Player p = redTeamPlayers.get(i);
            final int idx = i;
            final long delay = (long) (blueTeamPlayers.size() + i) * 20;
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                Location[] spawns = getRedSpawns();
                p.teleport(spawns[idx % spawns.length]);
                setupPlayer(p, "red");
            }, delay);
        }

        setState(GameState.READY);
        LOGGER.info("CTF game initialized for match " + matchId + " (" +
                    blueTeamPlayers.size() + "v" + redTeamPlayers.size() + ")");
    }

    @Override
    public void start() {
        if (state != GameState.READY) {
            LOGGER.warning("Cannot start CTF — not READY (current: " + state + ")");
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
            broadcastMessage("§c" + deadPlayer.getName() + " §7died");
        }

        // Drop flag if carrying
        String deadTeam = getTeamForPlayer(deadId);
        if ("blue".equals(deadTeam) && redFlag.carrier != null && redFlag.carrier.equals(deadId)) {
            redFlag.drop(deadPlayer.getLocation());
            broadcastMessage("§e§lRed flag dropped!");
            placeFlagBlock(redFlag.currentLocation, Material.RED_BANNER);
        } else if ("red".equals(deadTeam) && blueFlag.carrier != null && blueFlag.carrier.equals(deadId)) {
            blueFlag.drop(deadPlayer.getLocation());
            broadcastMessage("§e§lBlue flag dropped!");
            placeFlagBlock(blueFlag.currentLocation, Material.BLUE_BANNER);
        }

        // Start respawn timer
        respawnTimers.put(deadId, System.currentTimeMillis() + (RESPAWN_SECONDS * 1000L));

        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            if (!isActive()) return;
            respawnTimers.remove(deadId);
            Player player = Bukkit.getPlayer(deadId);
            if (player != null && player.isOnline()) {
                respawnPlayer(player, deadTeam);
                player.sendMessage("§aRespawned!");
            }
        }, RESPAWN_SECONDS * 20L);

        return true;
    }

    @Override
    public boolean handleObjective(String objectiveType, Player player, Map<String, Object> data) {
        switch (objectiveType) {
            case "flag_pickup":
                return handleFlagPickup(player);
            case "flag_capture":
                return handleFlagCapture(player);
            case "flag_return":
                return handleFlagReturn(player);
            default:
                return false;
        }
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
        state.put("blueCaptures", captures.get("blue"));
        state.put("redCaptures", captures.get("red"));
        state.put("blueFlagStatus", blueFlag.status.name());
        state.put("redFlagStatus", redFlag.status.name());

        if (blueFlag.carrier != null) state.put("blueFlagCarrier", blueFlag.carrier.toString());
        if (redFlag.carrier != null) state.put("redFlagCarrier", redFlag.carrier.toString());

        List<Map<String, Object>> playerStats = new ArrayList<>();
        for (UUID playerId : players) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("playerId", playerId.toString());
            stats.put("team", getTeamForPlayer(playerId));
            stats.put("kills", kills.getOrDefault(playerId, 0));
            stats.put("deaths", deaths.getOrDefault(playerId, 0));
            stats.put("damageDealt", damageDealt.getOrDefault(playerId, 0.0));
            stats.put("disconnected", isPlayerDisconnected(playerId));

            Player p = Bukkit.getPlayer(playerId);
            if (p != null && p.isOnline()) {
                stats.put("health", p.getHealth());
            }

            playerStats.add(stats);
        }
        state.put("players", playerStats);

        if (winnerId != null) state.put("winnerId", winnerId.toString());
        return state;
    }

    @Override
    public void cleanup() {
        if (countdownTask != null && !countdownTask.isCancelled()) countdownTask.cancel();
        if (gameLoopTask != null && !gameLoopTask.isCancelled()) gameLoopTask.cancel();
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

        LOGGER.info("CTF game cleanup for match " + matchId);
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

        LOGGER.info("Player " + playerId + " disconnected from CTF match " + matchId);

        // Drop flag if carrying
        String team = getTeamForPlayer(playerId);
        if ("blue".equals(team) && redFlag.carrier != null && redFlag.carrier.equals(playerId)) {
            Player p = Bukkit.getPlayer(playerId);
            Location dropLoc = p != null ? p.getLocation() : redFlag.baseLocation;
            redFlag.drop(dropLoc);
            broadcastMessage("§e§lRed flag dropped! (carrier disconnected)");
        } else if ("red".equals(team) && blueFlag.carrier != null && blueFlag.carrier.equals(playerId)) {
            Player p = Bukkit.getPlayer(playerId);
            Location dropLoc = p != null ? p.getLocation() : blueFlag.baseLocation;
            blueFlag.drop(dropLoc);
            broadcastMessage("§e§lBlue flag dropped! (carrier disconnected)");
        }

        disconnectedPlayers.put(playerId, System.currentTimeMillis());

        // Check if team has enough players
        int activeBlue = countActivePlayers("blue");
        int activeRed = countActivePlayers("red");

        if (activeBlue < MIN_PLAYERS_BEFORE_FORFEIT && activeRed < MIN_PLAYERS_BEFORE_FORFEIT) {
            // Both teams have insufficient players — terminate the match
            broadcastMessage("§cBoth teams have too few players. Match terminated!");
            terminateGame("Both teams forfeited — insufficient players");
            return DisconnectResult.FORFEIT;
        } else if (activeBlue < MIN_PLAYERS_BEFORE_FORFEIT) {
            winnerId = redTeam.get(0);
            broadcastMessage("§cBlue team forfeits — too many disconnects!");
            return DisconnectResult.FORFEIT;
        } else if (activeRed < MIN_PLAYERS_BEFORE_FORFEIT) {
            winnerId = blueTeam.get(0);
            broadcastMessage("§cRed team forfeits — too many disconnects!");
            return DisconnectResult.FORFEIT;
        }

        broadcastMessage("§c" + getPlayerName(playerId) + " §7disconnected. " +
                GRACE_PERIOD_SECONDS + "s to reconnect.");
        return DisconnectResult.GRACE_PERIOD;
    }

    @Override
    public boolean handlePlayerReconnect(UUID playerId) {
        if (!hasPlayer(playerId)) return false;

        disconnectedPlayers.remove(playerId);
        Player player = Bukkit.getPlayer(playerId);
        if (player != null) {
            String team = getTeamForPlayer(playerId);
            respawnPlayer(player, team);
            broadcastMessage("§a" + player.getName() + " §7reconnected!");
        }
        return true;
    }

    @Override
    public DisconnectPolicy getDisconnectPolicy() {
        return DisconnectPolicy.teamGame(GRACE_PERIOD_SECONDS, MIN_PLAYERS_BEFORE_FORFEIT);
    }

    // ==================== Flag Mechanics ====================

    private boolean handleFlagPickup(Player player) {
        UUID playerId = player.getUniqueId();
        String team = getTeamForPlayer(playerId);
        if (team == null) return false;

        // Blue picks up RED flag, Red picks up BLUE flag
        if ("blue".equals(team)) {
            if (redFlag.status == FlagState.Status.CARRIED) return false;
            redFlag.pickup(playerId);
            clearFlagBlock(redFlag.currentLocation);
            broadcastMessage("§a" + player.getName() + " §7picked up the §cRed flag!");
            playSound(Sound.BLOCK_NOTE_BLOCK_BELL, 1.5f);
        } else {
            if (blueFlag.status == FlagState.Status.CARRIED) return false;
            blueFlag.pickup(playerId);
            clearFlagBlock(blueFlag.currentLocation);
            broadcastMessage("§a" + player.getName() + " §7picked up the §9Blue flag!");
            playSound(Sound.BLOCK_NOTE_BLOCK_BELL, 1.5f);
        }

        return true;
    }

    private boolean handleFlagCapture(Player player) {
        UUID playerId = player.getUniqueId();
        String team = getTeamForPlayer(playerId);
        if (team == null) return false;

        if ("blue".equals(team) && redFlag.carrier != null && redFlag.carrier.equals(playerId)) {
            captures.merge("blue", 1, Integer::sum);
            redFlag.returnToBase();
            placeFlagBlock(redFlag.baseLocation, Material.RED_BANNER);
            broadcastMessage("§9§lBLUE CAPTURED! §7[" + captures.get("blue") + " - " + captures.get("red") + "]");
            playSound(Sound.UI_TOAST_CHALLENGE_COMPLETE, 1.0f);

            if (captures.get("blue") >= CAPTURES_TO_WIN) {
                winnerId = blueTeam.get(0);
            }
            resetPositions();
            return true;
        } else if ("red".equals(team) && blueFlag.carrier != null && blueFlag.carrier.equals(playerId)) {
            captures.merge("red", 1, Integer::sum);
            blueFlag.returnToBase();
            placeFlagBlock(blueFlag.baseLocation, Material.BLUE_BANNER);
            broadcastMessage("§c§lRED CAPTURED! §7[" + captures.get("blue") + " - " + captures.get("red") + "]");
            playSound(Sound.UI_TOAST_CHALLENGE_COMPLETE, 1.0f);

            if (captures.get("red") >= CAPTURES_TO_WIN) {
                winnerId = redTeam.get(0);
            }
            resetPositions();
            return true;
        }

        return false;
    }

    private boolean handleFlagReturn(Player player) {
        UUID playerId = player.getUniqueId();
        String team = getTeamForPlayer(playerId);
        if (team == null) return false;

        // Return own team's dropped flag
        if ("blue".equals(team) && blueFlag.status == FlagState.Status.DROPPED) {
            clearFlagBlock(blueFlag.currentLocation);
            blueFlag.returnToBase();
            placeFlagBlock(blueFlag.baseLocation, Material.BLUE_BANNER);
            broadcastMessage("§a" + player.getName() + " §7returned the §9Blue flag!");
            return true;
        } else if ("red".equals(team) && redFlag.status == FlagState.Status.DROPPED) {
            clearFlagBlock(redFlag.currentLocation);
            redFlag.returnToBase();
            placeFlagBlock(redFlag.baseLocation, Material.RED_BANNER);
            broadcastMessage("§a" + player.getName() + " §7returned the §cRed flag!");
            return true;
        }

        return false;
    }

    private void placeFlagBlock(Location loc, Material material) {
        if (world == null) return;
        Block block = world.getBlockAt(loc);
        block.setType(material);
    }

    private void clearFlagBlock(Location loc) {
        if (world == null) return;
        Block block = world.getBlockAt(loc);
        block.setType(Material.AIR);
    }

    // ==================== Arena Generation ====================

    @Override
    protected void generateArena() {
        if (world == null) return;

        // === Ground: stone floor with central path ===
        for (int x = -MAP_HALF; x <= MAP_HALF; x++) {
            for (int z = -MAP_HALF; z <= MAP_HALF; z++) {
                Material ground;
                if (Math.abs(z) <= 2) {
                    ground = Material.STONE_BRICKS; // Central lane
                } else {
                    ground = Material.STONE;
                }
                setBlock(x, FLOOR_Y, z, ground);
            }
        }

        // === Bases (compact 8x8) ===
        generateBase(BLUE_BASE_X - 4, BLUE_BASE_X + 4, Material.BLUE_CONCRETE, true);
        generateBase(RED_BASE_X - 4, RED_BASE_X + 4, Material.RED_CONCRETE, false);

        // === Mid-field cover ===
        // Two symmetric walls near center
        for (int z = -4; z <= 4; z++) {
            setBlock(8, FLOOR_Y + 1, z, Material.COBBLESTONE_WALL);
            setBlock(-8, FLOOR_Y + 1, z, Material.COBBLESTONE_WALL);
        }
        // Side cover blocks
        for (int z : new int[]{-10, 10}) {
            for (int x = -3; x <= 3; x++) {
                setBlock(x, FLOOR_Y + 1, z, Material.STONE_BRICKS);
            }
        }

        // === Boundary walls (3-high bedrock) ===
        for (int x = -MAP_HALF; x <= MAP_HALF; x++) {
            for (int y = FLOOR_Y + 1; y <= FLOOR_Y + 3; y++) {
                setBlock(x, y, -MAP_HALF, Material.BEDROCK);
                setBlock(x, y, MAP_HALF, Material.BEDROCK);
            }
        }
        for (int z = -MAP_HALF; z <= MAP_HALF; z++) {
            for (int y = FLOOR_Y + 1; y <= FLOOR_Y + 3; y++) {
                setBlock(-MAP_HALF, y, z, Material.BEDROCK);
                setBlock(MAP_HALF, y, z, Material.BEDROCK);
            }
        }

        // === Flags ===
        setBlock(BLUE_FLAG_X, FLOOR_Y, 0, Material.DIAMOND_BLOCK);
        placeFlagBlock(blueFlag.baseLocation, Material.BLUE_BANNER);
        setBlock(RED_FLAG_X, FLOOR_Y, 0, Material.GOLD_BLOCK);
        placeFlagBlock(redFlag.baseLocation, Material.RED_BANNER);

        LOGGER.info("CTF arena generated (50x50)");
    }

    private void generateBase(int x1, int x2, Material wallMaterial, boolean isBlue) {
        int z1 = -4;
        int z2 = 4;

        // Base floor
        for (int x = x1; x <= x2; x++) {
            for (int z = z1; z <= z2; z++) {
                setBlock(x, FLOOR_Y, z, wallMaterial);
            }
        }

        // Walls (2 high)
        for (int x = x1; x <= x2; x++) {
            for (int y = FLOOR_Y + 1; y <= FLOOR_Y + 2; y++) {
                setBlock(x, y, z1, wallMaterial);
                setBlock(x, y, z2, wallMaterial);
            }
        }
        // Back wall
        int backX = isBlue ? x2 : x1;
        for (int z = z1; z <= z2; z++) {
            for (int y = FLOOR_Y + 1; y <= FLOOR_Y + 2; y++) {
                setBlock(backX, y, z, wallMaterial);
            }
        }

        // Front opening (3-wide gate)
        int frontX = isBlue ? x1 : x2;
        for (int z = z1; z <= z2; z++) {
            if (Math.abs(z) > 1) {
                for (int y = FLOOR_Y + 1; y <= FLOOR_Y + 2; y++) {
                    setBlock(frontX, y, z, wallMaterial);
                }
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

    private Location[] getBlueSpawns() {
        return new Location[]{
            new Location(world, BLUE_BASE_X, FLOOR_Y + 1, -1, -90, 0),
            new Location(world, BLUE_BASE_X, FLOOR_Y + 1, 1, -90, 0),
            new Location(world, BLUE_BASE_X + 2, FLOOR_Y + 1, -1, -90, 0),
            new Location(world, BLUE_BASE_X + 2, FLOOR_Y + 1, 1, -90, 0),
        };
    }

    private Location[] getRedSpawns() {
        return new Location[]{
            new Location(world, RED_BASE_X, FLOOR_Y + 1, -1, 90, 0),
            new Location(world, RED_BASE_X, FLOOR_Y + 1, 1, 90, 0),
            new Location(world, RED_BASE_X - 2, FLOOR_Y + 1, -1, 90, 0),
            new Location(world, RED_BASE_X - 2, FLOOR_Y + 1, 1, 90, 0),
        };
    }

    private void teleportToSpawns(List<Player> bluePlayers, List<Player> redPlayers) {
        Location[] blueSpawns = getBlueSpawns();
        Location[] redSpawns = getRedSpawns();

        for (int i = 0; i < bluePlayers.size(); i++) {
            bluePlayers.get(i).teleport(blueSpawns[i % blueSpawns.length]);
        }
        for (int i = 0; i < redPlayers.size(); i++) {
            redPlayers.get(i).teleport(redSpawns[i % redSpawns.length]);
        }
    }

    private void setupPlayer(Player player, String team) {
        player.setGameMode(GameMode.SURVIVAL);
        player.getInventory().clear();

        // Loadout
        player.getInventory().addItem(new ItemStack(Material.IRON_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 32));
        player.getInventory().addItem(new ItemStack(Material.GOLDEN_APPLE, 3));

        // Team-colored leather armor
        Color armorColor = "blue".equals(team) ? Color.BLUE : Color.RED;
        player.getInventory().setHelmet(coloredArmor(Material.LEATHER_HELMET, armorColor));
        player.getInventory().setChestplate(coloredArmor(Material.LEATHER_CHESTPLATE, armorColor));
        player.getInventory().setLeggings(coloredArmor(Material.LEATHER_LEGGINGS, armorColor));
        player.getInventory().setBoots(coloredArmor(Material.LEATHER_BOOTS, armorColor));

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

    private ItemStack coloredArmor(Material material, Color color) {
        ItemStack item = new ItemStack(material, 1);
        LeatherArmorMeta meta = (LeatherArmorMeta) item.getItemMeta();
        meta.setColor(color);
        item.setItemMeta(meta);
        return item;
    }

    private void respawnPlayer(Player player, String team) {
        Location spawn;
        if ("blue".equals(team)) {
            spawn = new Location(world, BLUE_BASE_X, FLOOR_Y + 1, 0, -90, 0);
        } else {
            spawn = new Location(world, RED_BASE_X, FLOOR_Y + 1, 0, 90, 0);
        }
        player.teleport(spawn);
        player.setHealth(20.0);
        player.setFoodLevel(20);
        player.setSaturation(20.0f);

        // Restore loadout
        player.getInventory().clear();
        player.getInventory().addItem(new ItemStack(Material.IRON_SWORD, 1));
        player.getInventory().addItem(new ItemStack(Material.BOW, 1));
        player.getInventory().addItem(new ItemStack(Material.ARROW, 32));
        player.getInventory().addItem(new ItemStack(Material.GOLDEN_APPLE, 3));

        Color armorColor = "blue".equals(team) ? Color.BLUE : Color.RED;
        player.getInventory().setHelmet(coloredArmor(Material.LEATHER_HELMET, armorColor));
        player.getInventory().setChestplate(coloredArmor(Material.LEATHER_CHESTPLATE, armorColor));
        player.getInventory().setLeggings(coloredArmor(Material.LEATHER_LEGGINGS, armorColor));
        player.getInventory().setBoots(coloredArmor(Material.LEATHER_BOOTS, armorColor));
    }

    private void resetPositions() {
        for (UUID playerId : players) {
            if (disconnectedPlayers.containsKey(playerId)) continue;
            Player player = Bukkit.getPlayer(playerId);
            if (player != null && player.isOnline()) {
                String team = getTeamForPlayer(playerId);
                respawnPlayer(player, team);
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
                    if (countdown <= 5) {
                        broadcastTitle("§e" + countdown, "§7Capture the Flag!");
                        playSound(Sound.BLOCK_NOTE_BLOCK_PLING, 1.0f);
                    }
                    countdown--;
                } else {
                    startTime = System.currentTimeMillis();
                    pvpEnabled = true;
                    setState(GameState.IN_PROGRESS);

                    broadcastTitle("§a§lGO!", "§7Capture the enemy flag!");
                    playSound(Sound.ENTITY_ENDER_DRAGON_GROWL, 1.0f);

                    for (UUID playerId : players) {
                        Player player = Bukkit.getPlayer(playerId);
                        if (player != null && player.isOnline()) {
                            player.removePotionEffect(PotionEffectType.SLOWNESS);
                            player.removePotionEffect(PotionEffectType.JUMP_BOOST);
                        }
                    }

                    startGameLoop();
                    startTimer();

                    LOGGER.info("CTF match " + matchId + " started!");
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    private void startGameLoop() {
        gameLoopTask = new BukkitRunnable() {
            @Override
            public void run() {
                if (!isActive()) {
                    cancel();
                    return;
                }

                // Check for flag pickups, captures, and returns
                for (UUID playerId : players) {
                    if (disconnectedPlayers.containsKey(playerId)) continue;
                    if (respawnTimers.containsKey(playerId)) continue;

                    Player player = Bukkit.getPlayer(playerId);
                    if (player == null || !player.isOnline()) continue;

                    String team = getTeamForPlayer(playerId);
                    if (team == null) continue;

                    Location loc = player.getLocation();

                    // Check flag pickup (within 2 blocks of flag)
                    if ("blue".equals(team) && redFlag.status != FlagState.Status.CARRIED) {
                        if (loc.distanceSquared(redFlag.currentLocation) < 4) {
                            handleObjective("flag_pickup", player, Collections.emptyMap());
                            if (checkWinCondition()) { endGame(winnerId); return; }
                        }
                    } else if ("red".equals(team) && blueFlag.status != FlagState.Status.CARRIED) {
                        if (loc.distanceSquared(blueFlag.currentLocation) < 4) {
                            handleObjective("flag_pickup", player, Collections.emptyMap());
                            if (checkWinCondition()) { endGame(winnerId); return; }
                        }
                    }

                    // Check flag capture (carrier near own base flag)
                    if ("blue".equals(team) && redFlag.carrier != null && redFlag.carrier.equals(playerId)) {
                        if (loc.distanceSquared(blueFlag.baseLocation) < 9) {
                            handleObjective("flag_capture", player, Collections.emptyMap());
                            if (checkWinCondition()) { endGame(winnerId); return; }
                        }
                    } else if ("red".equals(team) && blueFlag.carrier != null && blueFlag.carrier.equals(playerId)) {
                        if (loc.distanceSquared(redFlag.baseLocation) < 9) {
                            handleObjective("flag_capture", player, Collections.emptyMap());
                            if (checkWinCondition()) { endGame(winnerId); return; }
                        }
                    }

                    // Check flag return (near own team's dropped flag)
                    if ("blue".equals(team) && blueFlag.status == FlagState.Status.DROPPED) {
                        if (loc.distanceSquared(blueFlag.currentLocation) < 4) {
                            handleObjective("flag_return", player, Collections.emptyMap());
                        }
                    } else if ("red".equals(team) && redFlag.status == FlagState.Status.DROPPED) {
                        if (loc.distanceSquared(redFlag.currentLocation) < 4) {
                            handleObjective("flag_return", player, Collections.emptyMap());
                        }
                    }
                }
            }
        }.runTaskTimer(plugin, 0L, 10L); // Every 0.5 seconds
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

                elapsed += 30;

                int remaining = TIME_LIMIT_SECONDS - elapsed;
                if (remaining == 60) {
                    broadcastMessage("§e1 minute remaining!");
                } else if (remaining == 30) {
                    broadcastMessage("§c30 seconds remaining!");
                }

                if (elapsed >= TIME_LIMIT_SECONDS) {
                    // Time's up
                    int blueScore = captures.get("blue");
                    int redScore = captures.get("red");

                    if (blueScore > redScore && !blueTeam.isEmpty()) {
                        winnerId = blueTeam.get(0);
                    } else if (redScore > blueScore && !redTeam.isEmpty()) {
                        winnerId = redTeam.get(0);
                    }
                    // If tied, no winner (draw)

                    broadcastMessage("§e§lTime's up! §7[" + blueScore + " - " + redScore + "]");
                    endGame(winnerId);
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 600L, 600L); // Every 30 seconds
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
}
