package ai.blockwarriors.beacon.util;

import org.json.JSONObject;

import java.net.HttpURLConnection;
import java.util.logging.Logger;

/**
 * Client for making requests to the Convex backend.
 * Combines {@link HttpClient} for HTTP operations and {@link ConvexResponseParser}
 * for response parsing into a simple, unified API.
 * 
 * This client is designed for the Convex HTTP API, which uses a standardized
 * response format: { success: true/false, data/error }
 * 
 * Usage:
 * <pre>
 * ConvexClient api = new ConvexClient("https://example.convex.site", "secret");
 * 
 * // GET request returning an object
 * ConvexResponseParser.ObjectResult result = api.getObject("/matches?id=123", false, "Fetch match");
 * if (result.isSuccess()) {
 *     JSONObject match = result.getData();
 * }
 * 
 * // GET request returning an array
 * ConvexResponseParser.ArrayResult matches = api.getArray("/matches", false, "Fetch matches");
 * if (matches.isSuccess()) {
 *     JSONArray data = matches.getData();
 * }
 * 
 * // POST request
 * JSONObject body = new JSONObject();
 * body.put("match_id", "123");
 * ConvexResponseParser.ObjectResult result = api.postObject("/matches/acknowledge", body, "Acknowledge match");
 * </pre>
 * 
 * @see HttpClient
 * @see ConvexResponseParser
 */
public class ConvexClient {
    private static final Logger LOGGER = Logger.getLogger("beacon");

    private final HttpClient httpClient;

    /**
     * Create a client for the Convex backend.
     *
     * @param baseUrl   The Convex site URL (e.g., "https://example.convex.site")
     * @param authToken The Convex HTTP secret for authenticated requests
     */
    public ConvexClient(String baseUrl, String authToken) {
        this.httpClient = new HttpClient(baseUrl, authToken);
    }

    /**
     * Perform a GET request and parse the response as an object.
     *
     * @param endpoint      The endpoint path (will be appended to baseUrl)
     * @param authenticated Whether to include the auth token
     * @param context       Description of the operation (for logging)
     * @return ObjectResult containing the parsed data or error
     */
    public ConvexResponseParser.ObjectResult getObject(String endpoint, boolean authenticated, String context) {
        try {
            HttpURLConnection conn = httpClient.createGetConnection(endpoint, authenticated);

            if (conn.getResponseCode() != 200) {
                String error = "HTTP " + conn.getResponseCode();
                LOGGER.warning(context + " failed: " + error);
                HttpClient.logErrorResponse(conn);
                return ConvexResponseParser.ObjectResult.error(error);
            }

            String response = HttpClient.readResponse(conn);
            return ConvexResponseParser.parseObject(response, context);
        } catch (Exception e) {
            LOGGER.severe(context + " error: " + e.getMessage());
            return ConvexResponseParser.ObjectResult.error(e.getMessage());
        }
    }

    /**
     * Perform a GET request and parse the response as an array.
     *
     * @param endpoint      The endpoint path (will be appended to baseUrl)
     * @param authenticated Whether to include the auth token
     * @param context       Description of the operation (for logging)
     * @return ArrayResult containing the parsed array or error
     */
    public ConvexResponseParser.ArrayResult getArray(String endpoint, boolean authenticated, String context) {
        try {
            HttpURLConnection conn = httpClient.createGetConnection(endpoint, authenticated);

            if (conn.getResponseCode() != 200) {
                String error = "HTTP " + conn.getResponseCode();
                LOGGER.warning(context + " failed: " + error);
                HttpClient.logErrorResponse(conn);
                return ConvexResponseParser.ArrayResult.error(error);
            }

            String response = HttpClient.readResponse(conn);
            return ConvexResponseParser.parseArray(response, context);
        } catch (Exception e) {
            LOGGER.severe(context + " error: " + e.getMessage());
            return ConvexResponseParser.ArrayResult.error(e.getMessage());
        }
    }

    /**
     * Perform a POST request and parse the response as an object.
     *
     * @param endpoint The endpoint path (will be appended to baseUrl)
     * @param body     The JSON request body
     * @param context  Description of the operation (for logging)
     * @return ObjectResult containing the parsed data or error
     */
    public ConvexResponseParser.ObjectResult postObject(String endpoint, JSONObject body, String context) {
        try {
            HttpURLConnection conn = httpClient.createPostConnection(endpoint);
            HttpClient.writeRequestBody(conn, body);

            if (conn.getResponseCode() != 200) {
                String error = "HTTP " + conn.getResponseCode();
                LOGGER.warning(context + " failed: " + error);
                HttpClient.logErrorResponse(conn);
                return ConvexResponseParser.ObjectResult.error(error);
            }

            String response = HttpClient.readResponse(conn);
            return ConvexResponseParser.parseObject(response, context);
        } catch (Exception e) {
            LOGGER.severe(context + " error: " + e.getMessage());
            return ConvexResponseParser.ObjectResult.error(e.getMessage());
        }
    }

    /**
     * Perform a POST request and check if it succeeded (ignoring response data).
     * Useful for fire-and-forget operations where you only need to know success/failure.
     *
     * @param endpoint The endpoint path (will be appended to baseUrl)
     * @param body     The JSON request body
     * @param context  Description of the operation (for logging)
     * @return true if the request succeeded
     */
    public boolean postSuccess(String endpoint, JSONObject body, String context) {
        ConvexResponseParser.ObjectResult result = postObject(endpoint, body, context);
        return result.isSuccess();
    }

    /**
     * Get the underlying HTTP client for low-level operations.
     */
    public HttpClient getHttpClient() {
        return httpClient;
    }

    /**
     * Get the base URL for this client.
     */
    public String getBaseUrl() {
        return httpClient.getBaseUrl();
    }
}

