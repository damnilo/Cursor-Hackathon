// OWNER: shared freeze for `repositories` and `studentProfiles`.
// AI track may add optional fields or a new `repoDocuments` table — do not rename existing fields.
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  contributionKindValidator,
  difficultyValidator,
  repositoryFields,
} from "./lib/validators";

export default defineSchema({
  repositories: defineTable(repositoryFields)
    .index("by_fullName", ["fullName"])
    .index("by_difficulty", ["difficulty"])
    .index("by_primaryLanguage", ["primaryLanguage"])
    .index("by_good_first", ["hasGoodFirstIssues"]),

  studentProfiles: defineTable({
    slug: v.optional(v.string()),
    label: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    languages: v.array(v.string()),
    stack: v.array(v.string()),
    topics: v.array(v.string()),
    level: difficultyValidator,
    wantGoodFirstIssue: v.boolean(),
    cvStorageId: v.optional(v.id("_storage")),
    cvFileName: v.optional(v.string()),
    isFixture: v.optional(v.boolean()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_sessionId", ["sessionId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  contributions: defineTable({
    profileId: v.optional(v.id("studentProfiles")),
    repositoryId: v.id("repositories"),
    title: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    whyThisIssue: v.optional(v.string()),
    steps: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    timeEstimate: v.optional(v.string()),
    kind: contributionKindValidator,
    status: v.optional(v.union(v.literal("suggested"), v.literal("completed"))),
    completedAt: v.optional(v.number()),
  })
    .index("by_repository", ["repositoryId"])
    .index("by_repo_and_kind", ["repositoryId", "kind"])
    .index("by_profile", ["profileId"])
    .index("by_profile_and_repo", ["profileId", "repositoryId"]),

  // AI track cache for Firecrawl README / CONTRIBUTING. Do not rename other tables.
  repoDocuments: defineTable({
    repositoryId: v.id("repositories"),
    readmeMarkdown: v.optional(v.string()),
    contributingMarkdown: v.optional(v.string()),
    source: v.union(v.literal("firecrawl"), v.literal("none")),
    note: v.string(),
    fetchedAt: v.number(),
  }).index("by_repository", ["repositoryId"]),
});
