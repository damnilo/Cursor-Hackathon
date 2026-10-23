import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const nextBatch = internalQuery({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      repositoryId: v.id("repositories"),
      owner: v.string(),
      name: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const repos = await ctx.db.query("repositories").take(100);
    return repos
      .sort((a, b) => (a.issuesCheckedAt ?? 0) - (b.issuesCheckedAt ?? 0))
      .slice(0, args.limit)
      .map((repo) => ({
        repositoryId: repo._id,
        owner: repo.owner,
        name: repo.name,
      }));
  },
});

export const saveCount = internalMutation({
  args: {
    repositoryId: v.id("repositories"),
    goodFirstIssueCount: v.union(v.number(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get("repositories", args.repositoryId);
    if (!repo) {
      return null;
    }
    if (args.goodFirstIssueCount === null) {
      await ctx.db.patch("repositories", repo._id, {
        issuesCheckedAt: Date.now(),
      });
      return null;
    }
    await ctx.db.patch("repositories", repo._id, {
      goodFirstIssueCount: args.goodFirstIssueCount,
      issuesCheckedAt: Date.now(),
      hasGoodFirstIssues: args.goodFirstIssueCount > 0,
    });
    return null;
  },
});
