"use node";

// OWNER: colleague (AI). Firecrawl README / CONTRIBUTING. Cached in repoDocuments.
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
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

const DOCS_BATCH = 1;

/** Fills README / CONTRIBUTING off the click path. One repo per run. */
export const refreshRepoDocs = internalAction({
  args: {},
  returns: v.object({
    checked: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx) => {
    const batch = await ctx.runQuery(internal.ai.store.nextDocsBatch, {
      limit: DOCS_BATCH,
    });
    let checked = 0;
    let failed = 0;
    for (const repo of batch) {
      try {
        await loadRepoDocs(ctx, repo.repositoryId);
        checked += 1;
      } catch (error) {
        console.error("repo docs refresh failed", repo.repositoryId, error);
        await ctx.runMutation(internal.ai.store.upsertRepoDocument, {
          repositoryId: repo.repositoryId,
          source: "none",
          note: "Firecrawl returned no docs; matching can continue without enrichment.",
        });
        failed += 1;
      }
    }
    return { checked, failed };
  },
});
