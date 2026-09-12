"use node";

// OWNER: colleague (AI). Firecrawl README / CONTRIBUTING. Cached in repoDocuments.
import { action } from "../_generated/server";
import { v } from "convex/values";
import { loadRepoDocs } from "./lib/docs";

export const enrichRepo = action({
  args: { repositoryId: v.id("repositories") },
  returns: v.object({
    repositoryId: v.id("repositories"),
    enriched: v.boolean(),
    note: v.string(),
  }),
  handler: async (ctx, args): Promise<{
    repositoryId: typeof args.repositoryId;
    enriched: boolean;
    note: string;
  }> => {
    const docs = await loadRepoDocs(ctx, args.repositoryId);
    const enriched = Boolean(
      docs?.readmeMarkdown || docs?.contributingMarkdown,
    );
    return {
      repositoryId: args.repositoryId,
      enriched,
      note: docs?.note ?? "Repository not found.",
    };
  },
});
