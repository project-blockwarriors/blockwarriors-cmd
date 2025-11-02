import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Settings is a singleton - we'll use a fixed ID
const SETTINGS_ID = "settings" as const;

// Get settings (singleton)
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    // Try to get the settings document
    // Since settings is a singleton, we'll query for any document
    // If none exists, return defaults
    const settings = await ctx.db.query("settings").first();
    
    if (!settings) {
      // Return default settings
      return {
        start_tournament: false,
        show_banner: false,
        banner_text_content: null,
        banner_button_content: null,
      };
    }

    return {
      start_tournament: settings.startTournament,
      show_banner: settings.showBanner,
      banner_text_content: settings.bannerTextContent,
      banner_button_content: settings.bannerButtonContent,
    };
  },
});

// Update settings (singleton)
export const updateSettings = mutation({
  args: {
    startTournament: v.union(v.boolean(), v.null()),
    showBanner: v.union(v.boolean(), v.null()),
    bannerTextContent: v.union(v.string(), v.null()),
    bannerButtonContent: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    // Get existing settings or create new
    const existing = await ctx.db.query("settings").first();

    const now = Date.now();

    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        startTournament: args.startTournament ?? existing.startTournament,
        showBanner: args.showBanner ?? existing.showBanner,
        bannerTextContent: args.bannerTextContent ?? existing.bannerTextContent,
        bannerButtonContent: args.bannerButtonContent ?? existing.bannerButtonContent,
        updatedAt: now,
      });
    } else {
      // Create new settings with defaults
      await ctx.db.insert("settings", {
        startTournament: args.startTournament ?? false,
        showBanner: args.showBanner ?? false,
        bannerTextContent: args.bannerTextContent ?? null,
        bannerButtonContent: args.bannerButtonContent ?? null,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});


