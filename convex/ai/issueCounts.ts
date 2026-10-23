"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { countOpenGoodFirstIssues } from "./lib/githubIssues";

const BATCH = 10;

export const refreshGoodFirstIssueCounts = internalAction({
  args: {},
  returns: v.object({
    checked: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx) => {
    const batch = await ctx.runQuery(internal.ai.issueCountStore.nextBatch, {
      limit: BATCH,
    });
    let checked = 0;
    let failed = 0;
    for (const repo of batch) {
      const count = await countOpenGoodFirstIssues(repo.owner, repo.name);
      await ctx.runMutation(internal.ai.issueCountStore.saveCount, {
        repositoryId: repo.repositoryId,
        goodFirstIssueCount: count,
      });
      if (count === null) {
        failed += 1;
      } else {
        checked += 1;
      }
    }
    return { checked, failed };
  },
});
