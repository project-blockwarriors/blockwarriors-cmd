// convexClient.js
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;

if (!convexUrl) {
  console.warn("CONVEX_URL environment variable is not set");
}

const convexClient = new ConvexHttpClient(convexUrl || "");

export { convexClient, api };
export default convexClient;
