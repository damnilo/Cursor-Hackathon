"use node";

// OWNER: colleague (AI). Firecrawl / Exa go here. Add `repoDocuments` via a schema PR.
import { action } from "../_generated/server";
import { v } from "convex/values";

export const enrichRepo = action({
  args: { repositoryId: v.id("repositories") },
  returns: v.object({
    repositoryId: v.id("repositories"),
    enriched: v.boolean(),
    note: v.string(),
  }),
  handler: async (_ctx, args) => ({
    repositoryId: args.repositoryId,
    enriched: false,
    note: "Stub — replace with Firecrawl / Exa in Phase 3.",
  }),
});
