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
    .index("by_language", ["primaryLanguage"])
    .index("by_good_first", ["hasGoodFirstIssues"]),

  // Fixture / demo profiles only. Live form profiles stay client-side (no auth)
  // and are passed as arguments to matchRepos.
  studentProfiles: defineTable({
    slug: v.string(),
    label: v.string(),
    languages: v.array(v.string()),
    stack: v.array(v.string()),
    topics: v.array(v.string()),
    level: difficultyValidator,
    wantGoodFirstIssue: v.boolean(),
    isFixture: v.boolean(),
  }).index("by_slug", ["slug"]),

  // Phase 3 writes here. Schema is ready so the UI can type against it.
  contributions: defineTable({
    repositoryId: v.id("repositories"),
    title: v.string(),
    issueUrl: v.optional(v.string()),
    steps: v.array(v.string()),
    skills: v.array(v.string()),
    timeEstimate: v.string(),
    kind: contributionKindValidator,
  })
    .index("by_repository", ["repositoryId"])
    .index("by_repo_and_kind", ["repositoryId", "kind"]),
});
