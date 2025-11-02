// convexClient.js
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;

if (!convexUrl) {
  console.warn("CONVEX_URL environment variable is not set");
}

const convexClient = new ConvexHttpClient(convexUrl || "");

// Helper function to set authentication token for subsequent calls
export function setAuthToken(token) {
  convexClient.setAuth(token);
}

// Helper function to clear authentication token
export function clearAuthToken() {
  convexClient.clearAuth();
}

// Helper function to make authenticated query
// token can be null/undefined for unauthenticated queries
export async function queryWithAuth(queryFn, args, token) {
  if (token) {
    convexClient.setAuth(token);
  } else {
    convexClient.clearAuth();
  }
  try {
    return await convexClient.query(queryFn, args);
  } finally {
    // Always clear auth after query to avoid state leakage
    convexClient.clearAuth();
  }
}

// Helper function to make authenticated mutation
// token can be null/undefined for unauthenticated mutations (rare)
export async function mutateWithAuth(mutationFn, args, token) {
  if (token) {
    convexClient.setAuth(token);
  } else {
    convexClient.clearAuth();
  }
  try {
    return await convexClient.mutation(mutationFn, args);
  } finally {
    // Always clear auth after mutation to avoid state leakage
    convexClient.clearAuth();
  }
}

export { convexClient, api };
export default convexClient;
