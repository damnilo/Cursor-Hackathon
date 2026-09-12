import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { contributionKindValidator } from "../lib/validators";
import schema from "../schema";

export const getRepository = internalQuery({
  args: { repositoryId: v.id("repositories") },
  returns: v.union(schema.doc("repositories"), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get("repositories", args.repositoryId);
  },
});

export const getRepoDocument = internalQuery({
  args: { repositoryId: v.id("repositories") },
  returns: v.union(schema.doc("repoDocuments"), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repoDocuments")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .unique();
  },
});

export const upsertRepoDocument = internalMutation({
  args: {
    repositoryId: v.id("repositories"),
    readmeMarkdown: v.optional(v.string()),
    contributingMarkdown: v.optional(v.string()),
    source: v.union(
      v.literal("firecrawl"),
      v.literal("none"),
    ),
    note: v.string(),
  },
  returns: v.id("repoDocuments"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repoDocuments")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .unique();

    const doc = {
      repositoryId: args.repositoryId,
      readmeMarkdown: args.readmeMarkdown,
      contributingMarkdown: args.contributingMarkdown,
      source: args.source,
      note: args.note,
      fetchedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch("repoDocuments", existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("repoDocuments", doc);
  },
});

export const applyContributionPlan = internalMutation({
  args: {
    contributionId: v.id("contributions"),
    title: v.string(),
    issueUrl: v.optional(v.string()),
    whyThisIssue: v.optional(v.string()),
    steps: v.array(v.string()),
    skills: v.array(v.string()),
    timeEstimate: v.string(),
    kind: contributionKindValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("contributions", args.contributionId, {
      title: args.title,
      issueUrl: args.issueUrl,
      whyThisIssue: args.whyThisIssue,
      steps: args.steps,
      skills: args.skills,
      timeEstimate: args.timeEstimate,
      kind: args.kind,
      status: "suggested",
    });
    return null;
  },
});
