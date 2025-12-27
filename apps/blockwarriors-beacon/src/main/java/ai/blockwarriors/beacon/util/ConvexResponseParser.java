package ai.blockwarriors.beacon.util;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.logging.Logger;

/**
 * Parser for Convex HTTP API responses.
 * 
 * Convex HTTP routes return responses in this standardized format:
 * - Success: { "success": true, "data": T }
 * - Error:   { "success": false, "error": string }
 * 
 * This parser extracts the data or error from these responses.
 * For high-level API calls, use {@link ConvexClient} which combines
 * this parser with {@link HttpClient}.
 * 
 * Direct usage example:
 * <pre>
 * String responseBody = ... // from Convex HTTP call
 * ConvexResponseParser.ObjectResult result = ConvexResponseParser.parseObject(responseBody, "Fetch match");
 * if (result.isSuccess()) {
 *     JSONObject data = result.getData();
 * } else {
 *     String error = result.getError();
 * }
 * </pre>
 * 
 * @see ConvexClient
 * @see HttpClient
 */
public class ConvexResponseParser {
    private static final Logger LOGGER = Logger.getLogger("beacon");

    /**
     * Result of parsing a Convex response that expects an object in the data field.
     */
    public static class ObjectResult {
        private final boolean success;
        private final JSONObject data;
        private final String error;

        private ObjectResult(boolean success, JSONObject data, String error) {
            this.success = success;
            this.data = data;
            this.error = error;
        }

        public boolean isSuccess() {
            return success;
        }

        public JSONObject getData() {
            return data;
        }

        public String getError() {
            return error;
        }

        public static ObjectResult success(JSONObject data) {
            return new ObjectResult(true, data, null);
        }

        public static ObjectResult error(String error) {
            return new ObjectResult(false, null, error);
        }
    }

    /**
     * Result of parsing a Convex response that expects an array in the data field.
     */
    public static class ArrayResult {
        private final boolean success;
        private final JSONArray data;
        private final String error;

        private ArrayResult(boolean success, JSONArray data, String error) {
            this.success = success;
            this.data = data;
            this.error = error;
        }

        public boolean isSuccess() {
            return success;
        }

        public JSONArray getData() {
            return data;
        }

        public String getError() {
            return error;
        }

        public static ArrayResult success(JSONArray data) {
            return new ArrayResult(true, data, null);
        }

        public static ArrayResult error(String error) {
            return new ArrayResult(false, null, error);
        }
    }

    /**
     * Parse Convex response with format: { success: boolean, data/error }
     * Returns the data object if successful.
     * 
     * @param responseBody The raw response body as a string
     * @param context Description of the operation (for logging)
     * @return ObjectResult containing the parsed data or error
     */
    public static ObjectResult parseObject(String responseBody, String context) {
        // Handle null or empty response
        if (responseBody == null || responseBody.trim().isEmpty()) {
            LOGGER.warning(context + " - Response body is empty or null");
            return ObjectResult.error("Empty response from server");
        }

        // Check for HTML responses (common error pages)
        String trimmed = responseBody.trim();
        if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
            LOGGER.warning(context + " - Received HTML instead of JSON (possible error page)");
            return ObjectResult.error("Server returned HTML instead of JSON");
        }

        try {
            JSONObject response = new JSONObject(responseBody);

            if (!response.has("success")) {
                String error = "Invalid Convex response: missing 'success' field";
                LOGGER.warning(context + " - " + error);
                return ObjectResult.error(error);
            }

            boolean success = response.getBoolean("success");
            if (!success) {
                String error = response.optString("error", "Unknown error");
                LOGGER.warning(context + " error: " + error);
                return ObjectResult.error(error);
            }

            // Return the data field
            if (response.has("data")) {
                Object data = response.get("data");
                if (data instanceof JSONObject) {
                    return ObjectResult.success((JSONObject) data);
                } else if (data instanceof JSONArray) {
                    // For array responses, wrap in object with "items" key
                    JSONObject wrapper = new JSONObject();
                    wrapper.put("items", data);
                    return ObjectResult.success(wrapper);
                } else if (data == JSONObject.NULL) {
                    // Null data is valid for some responses
                    return ObjectResult.success(new JSONObject());
                }
            }

            // Empty success (no data field)
            return ObjectResult.success(new JSONObject());
        } catch (JSONException e) {
            String error = "Failed to parse response: " + e.getMessage();
            LOGGER.warning(context + " - " + error);
            // Log the actual response for debugging (truncated for safety)
            String preview = responseBody.length() > 200 
                ? responseBody.substring(0, 200) + "..." 
                : responseBody;
            LOGGER.warning(context + " - Response body: " + preview);
            return ObjectResult.error(error);
        }
    }

    /**
     * Parse Convex response that returns an array in the data field.
     * Returns the array if successful.
     * 
     * @param responseBody The raw response body as a string
     * @param context Description of the operation (for logging)
     * @return ArrayResult containing the parsed array or error
     */
    public static ArrayResult parseArray(String responseBody, String context) {
        // Handle null or empty response
        if (responseBody == null || responseBody.trim().isEmpty()) {
            LOGGER.warning(context + " - Response body is empty or null");
            return ArrayResult.error("Empty response from server");
        }

        // Check for HTML responses (common error pages)
        String trimmed = responseBody.trim();
        if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
            LOGGER.warning(context + " - Received HTML instead of JSON (possible error page)");
            return ArrayResult.error("Server returned HTML instead of JSON");
        }

        try {
            JSONObject response = new JSONObject(responseBody);

            if (!response.has("success")) {
                String error = "Invalid Convex response: missing 'success' field";
                LOGGER.warning(context + " - " + error);
                return ArrayResult.error(error);
            }

            boolean success = response.getBoolean("success");
            if (!success) {
                String error = response.optString("error", "Unknown error");
                LOGGER.warning(context + " error: " + error);
                return ArrayResult.error(error);
            }

            if (response.has("data")) {
                return ArrayResult.success(response.getJSONArray("data"));
            }

            // Empty success (no data field)
            return ArrayResult.success(new JSONArray());
        } catch (JSONException e) {
            String error = "Failed to parse response: " + e.getMessage();
            LOGGER.warning(context + " - " + error);
            // Log the actual response for debugging (truncated for safety)
            String preview = responseBody.length() > 200 
                ? responseBody.substring(0, 200) + "..." 
                : responseBody;
            LOGGER.warning(context + " - Response body: " + preview);
            return ArrayResult.error(error);
        }
    }

    /**
     * Quick check if a Convex response indicates success without fully parsing data.
     * Useful for operations where you only need to know if it succeeded.
     * 
     * @param responseBody The raw response body as a string
     * @return true if the response indicates success, false otherwise
     */
    public static boolean isSuccess(String responseBody) {
        try {
            JSONObject response = new JSONObject(responseBody);
            return response.has("success") && response.getBoolean("success");
        } catch (JSONException e) {
            return false;
        }
    }

    /**
     * Extract error message from a Convex response.
     * Returns null if the response is successful or cannot be parsed.
     * 
     * @param responseBody The raw response body as a string
     * @return The error message, or null if successful/unparseable
     */
    public static String getError(String responseBody) {
        try {
            JSONObject response = new JSONObject(responseBody);
            if (response.has("success") && !response.getBoolean("success")) {
                return response.optString("error", "Unknown error");
            }
            return null;
        } catch (JSONException e) {
            return "Failed to parse response: " + e.getMessage();
        }
    }
}

