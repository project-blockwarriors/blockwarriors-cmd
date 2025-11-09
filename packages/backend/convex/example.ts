import { query } from "../_generated/server";

// Example query function - replace with your actual functions
// This will work once you run `npx convex dev` or `npm run convex:codegen` to generate types
export const example = query({
  handler: async (ctx) => {
    return { message: "Convex is working!" };
  },
});
