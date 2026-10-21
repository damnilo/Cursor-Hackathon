import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { syncCuratedRepositoriesIfChanged } from "./lib/catalogSync";

const seedResult = v.object({
  inserted: v.number(),
  updated: v.number(),
  removedDuplicates: v.number(),
  total: v.number(),
  skipped: v.boolean(),
});

export const seedRepositories = mutation({
  args: {},
  returns: seedResult,
  handler: async (ctx) => {
    return await syncCuratedRepositoriesIfChanged(ctx);
  },
});

export const repositoryCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const repos = await ctx.db.query("repositories").take(100);
    return repos.length;
  },
});
