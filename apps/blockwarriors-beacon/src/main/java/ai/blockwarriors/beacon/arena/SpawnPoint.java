package ai.blockwarriors.beacon.arena;

import org.bukkit.Location;
import org.bukkit.World;

/**
 * Represents a spawn point in an arena.
 * Spawn points define where players appear when the game starts or after respawning.
 */
public class SpawnPoint {
    
    private final double x;
    private final double y;
    private final double z;
    private final float yaw;
    private final float pitch;
    
    /**
     * Create a spawn point with position only (facing default direction).
     */
    public SpawnPoint(double x, double y, double z) {
        this(x, y, z, 0.0f, 0.0f);
    }
    
    /**
     * Create a spawn point with position and rotation.
     * 
     * @param x X coordinate
     * @param y Y coordinate
     * @param z Z coordinate
     * @param yaw Horizontal rotation (-180 to 180, 0 = south)
     * @param pitch Vertical rotation (-90 to 90, negative = up)
     */
    public SpawnPoint(double x, double y, double z, float yaw, float pitch) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.yaw = yaw;
        this.pitch = pitch;
    }
    
    public double getX() {
        return x;
    }
    
    public double getY() {
        return y;
    }
    
    public double getZ() {
        return z;
    }
    
    public float getYaw() {
        return yaw;
    }
    
    public float getPitch() {
        return pitch;
    }
    
    /**
     * Convert to a Bukkit Location in the specified world.
     * 
     * @param world The world for the location
     * @return A Bukkit Location object
     */
    public Location toLocation(World world) {
        return new Location(world, x, y, z, yaw, pitch);
    }
    
    /**
     * Create a spawn point offset from the arena origin.
     * 
     * @param originX Arena origin X
     * @param originY Arena origin Y
     * @param originZ Arena origin Z
     * @return A new SpawnPoint with absolute coordinates
     */
    public SpawnPoint withOffset(double originX, double originY, double originZ) {
        return new SpawnPoint(
            x + originX,
            y + originY,
            z + originZ,
            yaw,
            pitch
        );
    }
    
    @Override
    public String toString() {
        return String.format("SpawnPoint{x=%.1f, y=%.1f, z=%.1f, yaw=%.1f, pitch=%.1f}",
                x, y, z, yaw, pitch);
    }
}
