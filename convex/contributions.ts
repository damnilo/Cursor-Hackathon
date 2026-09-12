// OWNER: Lazar (infra). Read + status updates only.
// AI track inserts/updates title, steps, issueUrl, whyThisIssue via generateContribution.
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { contributionKindValidator } from "./lib/validators";

const contributionDoc = v.object({
  _id: v.id("contributions"),
  _creationTime: v.number(),
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
});

export const listBySession = query({
  args: { sessionId: v.string() },
  returns: v.array(contributionDoc),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!profile) {
      return [];
    }
    return await ctx.db
      .query("contributions")
      .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
      .take(50);
  },
});

export const getForRepo = query({
  args: {
    sessionId: v.string(),
    repositoryId: v.id("repositories"),
  },
  returns: v.union(contributionDoc, v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    if (!profile) {
      return null;
    }
    return await ctx.db
      .query("contributions")
      .withIndex("by_profile_and_repo", (q) =>
        q.eq("profileId", profile._id).eq("repositoryId", args.repositoryId),
      )
      .unique();
  },
});

export const ensureSuggested = mutation({
  args: {
    sessionId: v.string(),
    repositoryId: v.id("repositories"),
    kind: v.optional(contributionKindValidator),
  },
  returns: v.union(v.id("contributions"), v.null()),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    const repo = await ctx.db.get("repositories", args.repositoryId);
    if (!profile || !repo) {
      return null;
    }

    const existing = await ctx.db
      .query("contributions")
      .withIndex("by_profile_and_repo", (q) =>
        q.eq("profileId", profile._id).eq("repositoryId", args.repositoryId),
      )
      .unique();
    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("contributions", {
      profileId: profile._id,
      repositoryId: args.repositoryId,
      title: `First contribution in ${repo.fullName}`,
      kind: args.kind ?? "first",
      status: "suggested",
    });
  },
});

export const markCompleted = mutation({
  args: {
    sessionId: v.string(),
    contributionId: v.id("contributions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    const contribution = await ctx.db.get("contributions", args.contributionId);
    if (!profile || !contribution) {
      throw new Error("Contribution not found");
    }
    if (contribution.profileId !== profile._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("contributions", args.contributionId, {
      status: "completed",
      completedAt: Date.now(),
    });
    return null;
  },
});
