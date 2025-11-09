import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Settings System
 * 
 * This module provides functions to manage application-wide settings stored in Convex.
 * Settings are stored as key-value pairs, allowing flexible storage of different data types.
 * 
 * Available Setting Keys:
 * - "home_banner": Banner settings object with {enabled, text_content, button_text, button_link}
 * - "start_tournament": Boolean indicating if tournament has started
 * 
 * To manually seed initial settings via Convex dashboard:
 * 
 * 1. Banner Settings:
 *    - Key: "home_banner"
 *    - Value: {
 *        enabled: false,
 *        text_content: "Welcome to BlockWarriors",
 *        button_text: "Learn More",
 *        button_link: "/competition"
 *      }
 * 
 * 2. Tournament Settings:
 *    - Key: "start_tournament"
 *    - Value: false
 * 
 * Example usage in Convex dashboard:
 * - Call mutation: setSetting({key: "home_banner", value: {enabled: true, text_content: "...", ...}})
 * - Call query: getBannerSettings() to retrieve banner config
 */

// Generic function to get any setting by key
export const getSetting = query({
  args: {
    key: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return setting ? setting.value : null;
  },
});

// Get banner settings - returns banner config object or null if disabled/not found
export const getBannerSettings = query({
  args: {},
  returns: v.union(
    v.object({
      enabled: v.optional(v.boolean()),
      text_content: v.optional(v.string()),
      button_text: v.optional(v.string()),
      button_link: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "home_banner"))
      .first();

    if (!setting || !setting.value) {
      return null;
    }

    const bannerSettings = setting.value as {
      enabled?: boolean;
      text_content?: string;
      button_text?: string;
      button_link?: string;
    };

    // Return null if banner is disabled
    if (bannerSettings.enabled === false) {
      return null;
    }

    return bannerSettings;
  },
});

// Get tournament settings - returns tournament-related settings
export const getTournamentSettings = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "start_tournament"))
      .first();

    return setting ? (setting.value as boolean) : false;
  },
});

// Get all settings - useful for admin page later
export const getAllSettings = query({
  args: {},
  returns: v.record(v.string(), v.any()),
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").collect();
    
    const settingsMap: Record<string, any> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return settingsMap;
  },
});

// Generic function to set/update any setting
export const setSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  returns: v.id("settings"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing setting
      await ctx.db.patch(existing._id, {
        value: args.value,
        updated_at: now,
      });
      return existing._id;
    } else {
      // Create new setting
      const id = await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        updated_at: now,
      });
      return id;
    }
  },
});

// Update banner settings - specific function for banner updates
export const updateBannerSettings = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    text_content: v.optional(v.string()),
    button_text: v.optional(v.string()),
    button_link: v.optional(v.string()),
  },
  returns: v.id("settings"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "home_banner"))
      .first();

    const now = Date.now();

    // Get current banner settings or create defaults
    const currentSettings = existing
      ? (existing.value as {
          enabled?: boolean;
          text_content?: string;
          button_text?: string;
          button_link?: string;
        })
      : { enabled: false };

    // Merge new settings with existing ones
    const updatedSettings = {
      enabled: args.enabled !== undefined ? args.enabled : currentSettings.enabled,
      text_content: args.text_content !== undefined ? args.text_content : currentSettings.text_content,
      button_text: args.button_text !== undefined ? args.button_text : currentSettings.button_text,
      button_link: args.button_link !== undefined ? args.button_link : currentSettings.button_link,
    };

    if (existing) {
      // Update existing setting
      await ctx.db.patch(existing._id, {
        value: updatedSettings,
        updated_at: now,
      });
      return existing._id;
    } else {
      // Create new setting
      const id = await ctx.db.insert("settings", {
        key: "home_banner",
        value: updatedSettings,
        updated_at: now,
      });
      return id;
    }
  },
});

// Update tournament settings - specific function for tournament updates
export const updateTournamentSettings = mutation({
  args: {
    start_tournament: v.boolean(),
  },
  returns: v.id("settings"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "start_tournament"))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing setting
      await ctx.db.patch(existing._id, {
        value: args.start_tournament,
        updated_at: now,
      });
      return existing._id;
    } else {
      // Create new setting
      const id = await ctx.db.insert("settings", {
        key: "start_tournament",
        value: args.start_tournament,
        updated_at: now,
      });
      return id;
    }
  },
});

