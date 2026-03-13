package ai.blockwarriors.beacon.util;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.logging.Logger;

/**
 * Low-level HTTP client utility for making HTTP requests.
 * Provides methods for creating connections and reading/writing data.
 * 
 * This client is generic and can be used with any HTTP backend.
 * It supports optional Bearer token authentication but does not require it.
 * 
 * For Convex-specific high-level API calls with automatic response parsing, 
 * use {@link ConvexClient}.
 * 
 * Usage example:
 * <pre>
 * // With authentication
 * HttpClient client = new HttpClient("https://api.example.com", "my-token");
 * HttpURLConnection conn = client.createGetConnection("/users", true);
 * 
 * // Without authentication
 * HttpClient publicClient = new HttpClient("https://api.example.com", null);
 * HttpURLConnection conn = publicClient.createGetConnection("/public/data", false);
 * 
 * // Read response
 * String response = HttpClient.readResponse(conn);
 * </pre>
 * 
 * @see ConvexResponseParser
 * @see ConvexClient
 */
public class HttpClient {
    private static final Logger LOGGER = Logger.getLogger("beacon");

    private final String baseUrl;
    private final String authToken;

    /**
     * Create an HTTP client for a specific base URL.
     *
     * @param baseUrl   The base URL for HTTP calls (e.g., "https://api.example.com")
     * @param authToken The Bearer authentication token (can be null for unauthenticated requests)
     */
    public HttpClient(String baseUrl, String authToken) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
    }

    /**
     * Create a GET connection.
     *
     * @param endpoint      The endpoint path (will be appended to baseUrl)
     * @param authenticated Whether to include the Bearer auth token
     * @return The configured HttpURLConnection
     */
    public HttpURLConnection createGetConnection(String endpoint, boolean authenticated) throws Exception {
        URL url = new URL(baseUrl + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-Type", "application/json");
        if (authenticated && authToken != null) {
            conn.setRequestProperty("Authorization", "Bearer " + authToken);
        }
        return conn;
    }

    /**
     * Create a POST connection with authentication.
     *
     * @param endpoint The endpoint path (will be appended to baseUrl)
     * @return The configured HttpURLConnection ready for output
     */
    public HttpURLConnection createPostConnection(String endpoint) throws Exception {
        return createPostConnection(endpoint, true);
    }

    /**
     * Create a POST connection.
     *
     * @param endpoint      The endpoint path (will be appended to baseUrl)
     * @param authenticated Whether to include the Bearer auth token
     * @return The configured HttpURLConnection ready for output
     */
    public HttpURLConnection createPostConnection(String endpoint, boolean authenticated) throws Exception {
        URL url = new URL(baseUrl + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        if (authenticated && authToken != null) {
            conn.setRequestProperty("Authorization", "Bearer " + authToken);
        }
        conn.setDoOutput(true);
        return conn;
    }

    /**
     * Write a JSON request body to a connection.
     *
     * @param conn The connection to write to
     * @param body The JSON body to write
     */
    public static void writeRequestBody(HttpURLConnection conn, JSONObject body) throws Exception {
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = body.toString().getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
    }

    /**
     * Read the response body from a successful connection.
     *
     * @param conn The connection to read from
     * @return The response body as a string
     */
    public static String readResponse(HttpURLConnection conn) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            return response.toString();
        }
    }

    /**
     * Read and log the error response from a failed connection.
     *
     * @param conn The connection to read the error from
     */
    public static void logErrorResponse(HttpURLConnection conn) {
        try {
            if (conn.getErrorStream() == null) {
                return;
            }
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                LOGGER.warning("Error response: " + response.toString());
            }
        } catch (Exception e) {
            // Ignore errors reading error stream
        }
    }

    /**
     * Read the error response body from a failed connection.
     *
     * @param conn The connection to read the error from
     * @return The error response body, or empty string if unavailable
     */
    public static String readErrorResponse(HttpURLConnection conn) {
        try {
            if (conn.getErrorStream() == null) {
                return "";
            }
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                return response.toString();
            }
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Get the base URL for this client.
     */
    public String getBaseUrl() {
        return baseUrl;
    }

    /**
     * Get the auth token for this client.
     */
    public String getAuthToken() {
        return authToken;
    }
}
