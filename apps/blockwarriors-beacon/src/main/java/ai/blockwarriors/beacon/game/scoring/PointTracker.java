package ai.blockwarriors.beacon.game.scoring;

import java.util.*;

/**
 * Tracks points earned by players during a match.
 *
 * <p>Point values:</p>
 * <ul>
 *   <li>Kill: +100</li>
 *   <li>Damage: +10 per 1.0 HP dealt</li>
 * </ul>
 */
public class PointTracker {

    public enum PointAction {
        KILL(100),
        DAMAGE(10);

        private final int pointsPer;

        PointAction(int pointsPer) {
            this.pointsPer = pointsPer;
        }

        public int getPointsPer() {
            return pointsPer;
        }
    }

    private final Map<UUID, Map<PointAction, Double>> breakdown = new HashMap<>();

    /**
     * Register a player so their score starts at zero.
     */
    public void registerPlayer(UUID playerId) {
        breakdown.putIfAbsent(playerId, new EnumMap<>(PointAction.class));
    }

    /**
     * Award points for an action.
     *
     * @param playerId the player earning points
     * @param action   the type of action
     * @param value    for KILL pass 1.0 per kill; for DAMAGE pass the raw damage amount
     */
    public void addPoints(UUID playerId, PointAction action, double value) {
        Map<PointAction, Double> playerMap = breakdown.computeIfAbsent(playerId,
                k -> new EnumMap<>(PointAction.class));
        double earned = value * action.getPointsPer();
        playerMap.merge(action, earned, Double::sum);
    }

    /**
     * Get total points for a player across all actions.
     */
    public int getPoints(UUID playerId) {
        Map<PointAction, Double> playerMap = breakdown.get(playerId);
        if (playerMap == null) return 0;
        double total = 0;
        for (double v : playerMap.values()) {
            total += v;
        }
        return (int) total;
    }

    /**
     * Get a breakdown of points by action type.
     *
     * @return map of action to points earned, or empty map if player not tracked
     */
    public Map<PointAction, Integer> getBreakdown(UUID playerId) {
        Map<PointAction, Double> playerMap = breakdown.get(playerId);
        if (playerMap == null) return Collections.emptyMap();
        Map<PointAction, Integer> result = new EnumMap<>(PointAction.class);
        for (Map.Entry<PointAction, Double> entry : playerMap.entrySet()) {
            result.put(entry.getKey(), (int) entry.getValue().doubleValue());
        }
        return result;
    }

    /**
     * Get all tracked player IDs.
     */
    public Set<UUID> getTrackedPlayers() {
        return Collections.unmodifiableSet(breakdown.keySet());
    }
}
