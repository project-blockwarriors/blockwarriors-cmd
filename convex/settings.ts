import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get application settings (public query, no auth required)
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    // Fetch settings from database - there should be exactly one settings document
    const settings = await ctx.db.query("settings").first();
    
    if (!settings) {
      // If no settings exist, return defaults (this shouldn't happen in production)
      // Settings should be initialized via mutation or manually in dashboard
      return {
        start_tournament: true,
        show_banner: false,
        banner_text_content: "",
        banner_button_content: "",
      };
    }

    return {
      start_tournament: settings.start_tournament,
      show_banner: settings.show_banner,
      banner_text_content: settings.banner_text_content,
      banner_button_content: settings.banner_button_content,
    };
  },
});

// Update settings (admin only - should add auth later)
export const updateSettings = mutation({
  args: {
    start_tournament: v.optional(v.boolean()),
    show_banner: v.optional(v.boolean()),
    banner_text_content: v.optional(v.string()),
    banner_button_content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get existing settings or create new one
    let settings = await ctx.db.query("settings").first();

    if (!settings) {
      // Create new settings document
      const now = Date.now();
      const newSettingsId = await ctx.db.insert("settings", {
        start_tournament: args.start_tournament ?? true,
        show_banner: args.show_banner ?? false,
        banner_text_content: args.banner_text_content ?? "",
        banner_button_content: args.banner_button_content ?? "",
        updatedAt: now,
      });
      return await ctx.db.get(newSettingsId);
    }

    // Update existing settings
    await ctx.db.patch(settings._id, {
      ...(args.start_tournament !== undefined && { start_tournament: args.start_tournament }),
      ...(args.show_banner !== undefined && { show_banner: args.show_banner }),
      ...(args.banner_text_content !== undefined && { banner_text_content: args.banner_text_content }),
      ...(args.banner_button_content !== undefined && { banner_button_content: args.banner_button_content }),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(settings._id);
  },
});

