import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userProfiles: defineTable({
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    institution: v.union(v.string(), v.null()),
    teamId: v.union(v.id("teams"), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("teamId", ["teamId"]),

  teams: defineTable({
    teamName: v.string(),
    leaderId: v.string(), 
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leaderId", ["leaderId"]),

  settings: defineTable({
    start_tournament: v.boolean(),
    show_banner: v.boolean(),
    banner_text_content: v.string(),
    banner_button_content: v.string(),
    updatedAt: v.number(),
  }),
});
