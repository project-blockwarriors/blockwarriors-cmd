package ai.blockwarriors.beacon.util;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.logging.Logger;

/**
 * Utility class for parsing standardized API responses from Convex.
 * 
 * All responses follow the format:
 * - Success: { "success": true, "data": T }
 * - Error:   { "success": false, "error": string }
 * 
 * This ensures consistent handling across all beacon services.
 */
public class ApiResponseParser {
    private static final Logger LOGGER = Logger.getLogger("beacon");

    /**
     * Result of parsing an API response that expects an object in the data field.
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
     * Result of parsing an API response that expects an array in the data field.
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
     * Parse API response with standardized format: { success: boolean, data/error }
     * Returns the data object if successful.
     * 
     * @param responseBody The raw response body as a string
     * @param context Description of the operation (for logging)
     * @return ObjectResult containing the parsed data or error
     */
    public static ObjectResult parseObject(String responseBody, String context) {
        try {
            JSONObject response = new JSONObject(responseBody);

            if (!response.has("success")) {
                String error = "Invalid API response: missing 'success' field";
                LOGGER.warning(context + " - " + error);
                return ObjectResult.error(error);
            }

            boolean success = response.getBoolean("success");
            if (!success) {
                String error = response.optString("error", "Unknown error");
                LOGGER.warning(context + " API error: " + error);
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
            return ObjectResult.error(error);
        }
    }

    /**
     * Parse API response that returns an array in the data field.
     * Returns the array if successful.
     * 
     * @param responseBody The raw response body as a string
     * @param context Description of the operation (for logging)
     * @return ArrayResult containing the parsed array or error
     */
    public static ArrayResult parseArray(String responseBody, String context) {
        try {
            JSONObject response = new JSONObject(responseBody);

            if (!response.has("success")) {
                String error = "Invalid API response: missing 'success' field";
                LOGGER.warning(context + " - " + error);
                return ArrayResult.error(error);
            }

            boolean success = response.getBoolean("success");
            if (!success) {
                String error = response.optString("error", "Unknown error");
                LOGGER.warning(context + " API error: " + error);
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
            return ArrayResult.error(error);
        }
    }

    /**
     * Quick check if a response indicates success without fully parsing data.
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
     * Extract error message from a response.
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

