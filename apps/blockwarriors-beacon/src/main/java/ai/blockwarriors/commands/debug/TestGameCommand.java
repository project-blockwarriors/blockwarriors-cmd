package ai.blockwarriors.commands.debug;

import java.util.*;
import java.util.logging.Logger;

import org.bukkit.Bukkit;
import org.bukkit.GameMode;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.WorldType;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import ai.blockwarriors.beacon.Plugin;
import ai.blockwarriors.beacon.arena.ArenaConfig;
import ai.blockwarriors.beacon.arena.ArenaManager;
import ai.blockwarriors.beacon.constants.GameConfig;
import ai.blockwarriors.beacon.game.BaseGame;
import ai.blockwarriors.beacon.game.GameRegistry;
import ai.blockwarriors.beacon.service.MatchManager;

/**
 * Debug command to start a local test match without Convex.
 * 
 * Usage:
 *   /testgame <game_type>                    - Start with sender and a random online player
 *   /testgame <game_type> <player1> <player2> - Start with specified players
 *   /testgame list                           - List registered game types
 */
public class TestGameCommand implements CommandExecutor, TabCompleter {
    
    private static final Logger LOGGER = Logger.getLogger("beacon");
    
    private final Plugin plugin;
    
    public TestGameCommand(Plugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage("§cThis command can only be used by players.");
            return true;
        }
        
        Player player = (Player) sender;
        
        if (args.length == 0) {
            sendUsage(player);
            return true;
        }
        
        String subCommand = args[0].toLowerCase();
        
        // Handle "list" subcommand
        if (subCommand.equals("list")) {
            listGameTypes(player);
            return true;
        }
        
        // Otherwise, treat as game type
        String gameType = subCommand;
        
        // Validate game type
        if (!GameConfig.isValidGameType(gameType)) {
            player.sendMessage("§cUnknown game type: §e" + gameType);
            player.sendMessage("§7Use §e/testgame list §7to see available types.");
            return true;
        }
        
        // Get players
        Player bluePlayer;
        Player redPlayer;
        
        if (args.length >= 3) {
            // Specified players
            bluePlayer = Bukkit.getPlayer(args[1]);
            redPlayer = Bukkit.getPlayer(args[2]);
            
            if (bluePlayer == null || !bluePlayer.isOnline()) {
                player.sendMessage("§cPlayer not found or offline: §e" + args[1]);
                return true;
            }
            if (redPlayer == null || !redPlayer.isOnline()) {
                player.sendMessage("§cPlayer not found or offline: §e" + args[2]);
                return true;
            }
        } else {
            // Use sender as blue player
            bluePlayer = player;
            
            // Find another online player for red team
            redPlayer = findOpponent(player);
            if (redPlayer == null) {
                player.sendMessage("§cNo other players online to play against.");
                player.sendMessage("§7Usage: §e/testgame " + gameType + " <player1> <player2>");
                return true;
            }
        }
        
        if (bluePlayer.equals(redPlayer)) {
            player.sendMessage("§cYou cannot play against yourself.");
            return true;
        }
        
        // Start the test match
        player.sendMessage("§aStarting test match: §e" + gameType);
        player.sendMessage("§7Blue: §b" + bluePlayer.getName() + " §7vs Red: §c" + redPlayer.getName());
        
        startTestMatch(gameType, bluePlayer, redPlayer);
        return true;
    }
    
    private void sendUsage(Player player) {
        player.sendMessage("§6=== Test Game Command ===");
        player.sendMessage("§e/testgame <game_type> §7- Start test match");
        player.sendMessage("§e/testgame <game_type> <blue> <red> §7- With specific players");
        player.sendMessage("§e/testgame list §7- List registered game types");
    }
    
    private void listGameTypes(Player player) {
        player.sendMessage("§6=== Available Game Types ===");
        
        // List all registered game types
        GameRegistry registry = GameRegistry.getInstance();
        Set<String> registered = registry.getRegisteredTypes();
        
        player.sendMessage("§7Registered in GameRegistry:");
        if (registered.isEmpty()) {
            player.sendMessage("§8  (none)");
        } else {
            for (String type : registered) {
                GameRegistry.GameMetadata meta = registry.getMetadata(type);
                if (meta != null) {
                    player.sendMessage("§a  - " + type + " §7(" + meta.getDisplayName() + ")");
                } else {
                    player.sendMessage("§a  - " + type);
                }
            }
        }
        
        player.sendMessage("§7All configured game types:");
        for (String type : GameConfig.GAME_TYPES) {
            boolean isRegistered = registered.contains(type);
            String status = isRegistered ? "§a✓" : "§c✗";
            player.sendMessage("§7  " + status + " §f" + type);
        }
    }
    
    private Player findOpponent(Player sender) {
        for (Player p : Bukkit.getOnlinePlayers()) {
            if (!p.equals(sender)) {
                return p;
            }
        }
        return null;
    }
    
    private void startTestMatch(String gameType, Player bluePlayer, Player redPlayer) {
        // Generate a test match ID
        String matchId = "test_" + System.currentTimeMillis();
        
        // Create world
        String worldName = createTestWorld(matchId);
        if (worldName == null) {
            bluePlayer.sendMessage("§cFailed to create test world.");
            return;
        }
        
        World world = Bukkit.getWorld(worldName);
        if (world == null) {
            bluePlayer.sendMessage("§cWorld not found after creation.");
            return;
        }
        
        List<Player> blueTeam = Collections.singletonList(bluePlayer);
        List<Player> redTeam = Collections.singletonList(redPlayer);
        
        // Check if game type is registered
        GameRegistry registry = GameRegistry.getInstance();
        if (registry.isRegistered(gameType)) {
            // Use GameRegistry
            BaseGame game = registry.createGame(gameType, plugin, matchId);
            if (game == null) {
                bluePlayer.sendMessage("§cFailed to create game instance.");
                return;
            }
            
            // Get arena config
            ArenaManager arenaManager = plugin.getArenaManager();
            ArenaConfig arenaConfig = null;
            if (arenaManager != null) {
                arenaConfig = arenaManager.getDefaultArena(gameType);
            }
            
            // Initialize and start game
            game.initialize(world, arenaConfig, blueTeam, redTeam);
            
            // Register with match manager
            MatchManager matchManager = plugin.getMatchManager();
            if (matchManager != null) {
                List<Player> allPlayers = new ArrayList<>();
                allPlayers.addAll(blueTeam);
                allPlayers.addAll(redTeam);
                matchManager.registerMatch(matchId, worldName, allPlayers, game);
            }
            
            game.start();
            
            LOGGER.info("Test game started: " + gameType + " (match: " + matchId + ")");
        } else {
            // Legacy fallback
            LOGGER.info("Game type '" + gameType + "' not registered, using legacy test match");
            startLegacyTestMatch(world, bluePlayer, redPlayer);
        }
    }
    
    private String createTestWorld(String matchId) {
        // Find the lowest unused world number
        int worldNumber = 1;
        String worldName = "test_" + worldNumber;
        while (Bukkit.getWorld(worldName) != null) {
            worldNumber++;
            worldName = "test_" + worldNumber;
        }
        
        try {
            WorldCreator creator = new WorldCreator(worldName);
            creator.type(WorldType.FLAT);
            creator.generateStructures(false);
            
            World world = creator.createWorld();
            if (world == null) {
                LOGGER.severe("Failed to create test world: " + worldName);
                return null;
            }
            
            // Configure world settings
            world.setSpawnLocation(0, 64, 0);
            world.setSpawnFlags(false, false);
            world.setDifficulty(org.bukkit.Difficulty.PEACEFUL);
            
            LOGGER.info("Created test world: " + worldName + " for match " + matchId);
            return worldName;
            
        } catch (Exception e) {
            LOGGER.severe("Error creating test world: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    private void startLegacyTestMatch(World world, Player bluePlayer, Player redPlayer) {
        // Set both players to survival mode
        bluePlayer.setGameMode(GameMode.SURVIVAL);
        redPlayer.setGameMode(GameMode.SURVIVAL);
        
        // Teleport players to spawn positions
        Location blueLoc = new Location(world, 10, 65, 0);
        blueLoc.setYaw(-90);
        Location redLoc = new Location(world, -10, 65, 0);
        redLoc.setYaw(90);
        
        bluePlayer.teleport(blueLoc);
        redPlayer.teleport(redLoc);
        
        // Clear inventories and reset health/hunger
        bluePlayer.getInventory().clear();
        redPlayer.getInventory().clear();
        bluePlayer.setHealth(20.0);
        redPlayer.setHealth(20.0);
        bluePlayer.setFoodLevel(20);
        redPlayer.setFoodLevel(20);
        bluePlayer.setSaturation(20.0f);
        redPlayer.setSaturation(20.0f);
        
        bluePlayer.sendMessage("§aLegacy test match started! Fight!");
        redPlayer.sendMessage("§aLegacy test match started! Fight!");
    }
    
    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String label, String[] args) {
        List<String> completions = new ArrayList<>();
        
        if (args.length == 1) {
            // First arg: game type or "list"
            String partial = args[0].toLowerCase();
            
            if ("list".startsWith(partial)) {
                completions.add("list");
            }
            
            for (String type : GameConfig.GAME_TYPES) {
                if (type.startsWith(partial)) {
                    completions.add(type);
                }
            }
        } else if (args.length == 2 || args.length == 3) {
            // Player names
            String partial = args[args.length - 1].toLowerCase();
            for (Player p : Bukkit.getOnlinePlayers()) {
                if (p.getName().toLowerCase().startsWith(partial)) {
                    completions.add(p.getName());
                }
            }
        }
        
        return completions;
    }
}
