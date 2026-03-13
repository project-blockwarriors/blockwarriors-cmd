package ai.blockwarriors.beacon.arena;

import org.bukkit.Location;

/**
 * Represents the boundaries of an arena as an axis-aligned bounding box.
 * Used for detecting when players leave the arena or for void detection.
 */
public class ArenaBoundary {
    
    private final double minX;
    private final double minY;
    private final double minZ;
    private final double maxX;
    private final double maxY;
    private final double maxZ;
    
    /**
     * Create arena boundaries.
     * 
     * @param minX Minimum X coordinate
     * @param minY Minimum Y coordinate
     * @param minZ Minimum Z coordinate
     * @param maxX Maximum X coordinate
     * @param maxY Maximum Y coordinate
     * @param maxZ Maximum Z coordinate
     */
    public ArenaBoundary(double minX, double minY, double minZ,
                         double maxX, double maxY, double maxZ) {
        // Ensure min <= max
        this.minX = Math.min(minX, maxX);
        this.minY = Math.min(minY, maxY);
        this.minZ = Math.min(minZ, maxZ);
        this.maxX = Math.max(minX, maxX);
        this.maxY = Math.max(minY, maxY);
        this.maxZ = Math.max(minZ, maxZ);
    }
    
    /**
     * Create arena boundaries from two corner coordinates.
     */
    public static ArenaBoundary fromCorners(double x1, double y1, double z1,
                                            double x2, double y2, double z2) {
        return new ArenaBoundary(x1, y1, z1, x2, y2, z2);
    }
    
    public double getMinX() {
        return minX;
    }
    
    public double getMinY() {
        return minY;
    }
    
    public double getMinZ() {
        return minZ;
    }
    
    public double getMaxX() {
        return maxX;
    }
    
    public double getMaxY() {
        return maxY;
    }
    
    public double getMaxZ() {
        return maxZ;
    }
    
    /**
     * Check if a location is within the boundaries.
     * 
     * @param location The location to check
     * @return true if location is within boundaries
     */
    public boolean contains(Location location) {
        return contains(location.getX(), location.getY(), location.getZ());
    }
    
    /**
     * Check if coordinates are within the boundaries.
     */
    public boolean contains(double x, double y, double z) {
        return x >= minX && x <= maxX &&
               y >= minY && y <= maxY &&
               z >= minZ && z <= maxZ;
    }
    
    /**
     * Check if a location is below the minimum Y (void death).
     */
    public boolean isBelowFloor(Location location) {
        return location.getY() < minY;
    }
    
    /**
     * Check if a location is within XZ bounds but at any Y level.
     * Useful for checking horizontal boundaries.
     */
    public boolean containsXZ(double x, double z) {
        return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
    }
    
    /**
     * Get the volume of the boundary box.
     */
    public double getVolume() {
        return (maxX - minX) * (maxY - minY) * (maxZ - minZ);
    }
    
    /**
     * Get the center point of the boundary.
     */
    public double[] getCenter() {
        return new double[] {
            (minX + maxX) / 2,
            (minY + maxY) / 2,
            (minZ + maxZ) / 2
        };
    }
    
    /**
     * Create a boundary offset from an arena origin.
     */
    public ArenaBoundary withOffset(double originX, double originY, double originZ) {
        return new ArenaBoundary(
            minX + originX, minY + originY, minZ + originZ,
            maxX + originX, maxY + originY, maxZ + originZ
        );
    }
    
    /**
     * Expand the boundary by a given amount in all directions.
     */
    public ArenaBoundary expand(double amount) {
        return new ArenaBoundary(
            minX - amount, minY - amount, minZ - amount,
            maxX + amount, maxY + amount, maxZ + amount
        );
    }
    
    @Override
    public String toString() {
        return String.format("ArenaBoundary{min=(%.1f, %.1f, %.1f), max=(%.1f, %.1f, %.1f)}",
                minX, minY, minZ, maxX, maxY, maxZ);
    }
}
