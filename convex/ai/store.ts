import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { contributionKindValidator } from "../lib/validators";
import { docsHuntFinished } from "../lib/docsHunt";
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
    profileUpdatedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get("contributions", args.contributionId);
    if (!existing) {
      throw new Error("Contribution not found");
    }
    if (existing.kind !== args.kind) {
      throw new Error("Plan kind does not match this contribution");
    }
    await ctx.db.patch("contributions", args.contributionId, {
      title: args.title,
      issueUrl: args.issueUrl,
      whyThisIssue: args.whyThisIssue,
      steps: args.steps,
      skills: args.skills,
      timeEstimate: args.timeEstimate,
      profileUpdatedAt: args.profileUpdatedAt,
    });
    return null;
  },
});

const MAX_RERANK = 15;

export const saveRerank = internalMutation({
  args: {
    profileId: v.id("studentProfiles"),
    rankedForUpdatedAt: v.optional(v.number()),
    rerank: v.array(
      v.object({
        repositoryId: v.id("repositories"),
        why: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get("studentProfiles", args.profileId);
    if (!profile || profile.updatedAt !== args.rankedForUpdatedAt) {
      return null;
    }
    await ctx.db.patch("studentProfiles", profile._id, {
      rerank: args.rerank.slice(0, MAX_RERANK),
      rerankForUpdatedAt: profile.updatedAt,
    });
    return null;
  },
});

export const nextDocsBatch = internalQuery({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      repositoryId: v.id("repositories"),
    }),
  ),
  handler: async (ctx, args) => {
    const repos = await ctx.db.query("repositories").take(100);
    const pending: { repositoryId: (typeof repos)[number]["_id"] }[] = [];
    for (const repo of repos) {
      const doc = await ctx.db
        .query("repoDocuments")
        .withIndex("by_repository", (q) => q.eq("repositoryId", repo._id))
        .first();
      if (docsHuntFinished(doc)) {
        continue;
      }
      pending.push({ repositoryId: repo._id });
      if (pending.length >= args.limit) {
        break;
      }
    }
    return pending;
  },
});
