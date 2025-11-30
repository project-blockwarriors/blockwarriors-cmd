import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add a new entry to the waitlist
 */
export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    class_year: v.string(),
    degree_type: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existing) {
      return {
        success: false,
        message: "This email is already on the waitlist!",
      };
    }

    // Insert new waitlist entry
    await ctx.db.insert("waitlist", {
      email: args.email.toLowerCase(),
      name: args.name,
      class_year: args.class_year,
      degree_type: args.degree_type,
      created_at: Date.now(),
    });

    return {
      success: true,
      message: "You've been added to the waitlist!",
    };
  },
});

/**
 * Get waitlist count (for display purposes)
 */
export const getWaitlistCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const entries = await ctx.db.query("waitlist").collect();
    return entries.length;
  },
});
