import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { difficultyValidator } from "./lib/validators";

export default defineSchema({
  repositories: defineTable({
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),
    url: v.string(),
    description: v.string(),
    primaryLanguage: v.string(),
    languages: v.array(v.string()),
    topics: v.array(v.string()),
    stack: v.array(v.string()),
    hasGoodFirstIssues: v.boolean(),
    hasContributingGuide: v.boolean(),
    difficulty: difficultyValidator,
    newcomerNote: v.string(),
    stars: v.number(),
    verified: v.literal(true),
  })
    .index("by_fullName", ["fullName"])
    .index("by_difficulty", ["difficulty"])
    .index("by_primaryLanguage", ["primaryLanguage"]),

  studentProfiles: defineTable({
    sessionId: v.string(),
    languages: v.array(v.string()),
    stack: v.array(v.string()),
    topics: v.array(v.string()),
    level: difficultyValidator,
    wantGoodFirstIssue: v.boolean(),
    updatedAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  // Filled in Phase 3 (Grok plans) and Phase 4 (mark completed). Schema now so UI/infra can join.
  contributions: defineTable({
    profileId: v.id("studentProfiles"),
    repositoryId: v.id("repositories"),
    kind: v.union(v.literal("first"), v.literal("next")),
    status: v.union(v.literal("suggested"), v.literal("completed")),
    completedAt: v.optional(v.number()),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_and_repo", ["profileId", "repositoryId"]),
});
