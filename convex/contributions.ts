// OWNER: Lazar (infra). Read + status updates only.
// AI track inserts/updates title, steps, issueUrl, whyThisIssue via generateContribution.
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { findContributionByKind, collapseContributions } from "./lib/contributionLookup";
import { contributionKindValidator } from "./lib/validators";
import { findProfile } from "./profiles";

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
  profileUpdatedAt: v.optional(v.number()),
});

export const listBySession = query({
  args: { sessionId: v.string() },
  returns: v.array(contributionDoc),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const profile = await findProfile(ctx, {
      sessionId: args.sessionId,
      tokenIdentifier: identity?.tokenIdentifier,
    });
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
    kind: contributionKindValidator,
  },
  returns: v.union(contributionDoc, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const profile = await findProfile(ctx, {
      sessionId: args.sessionId,
      tokenIdentifier: identity?.tokenIdentifier,
    });
    if (!profile) {
      return null;
    }
    return await findContributionByKind(
      ctx,
      profile._id,
      args.repositoryId,
      args.kind,
    );
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
    const identity = await ctx.auth.getUserIdentity();
    const profile = await findProfile(ctx, {
      sessionId: args.sessionId,
      tokenIdentifier: identity?.tokenIdentifier,
    });
    const repo = await ctx.db.get("repositories", args.repositoryId);
    if (!profile || !repo) {
      return null;
    }

    const kind = args.kind ?? "first";
    const already = await collapseContributions(
      ctx,
      profile._id,
      args.repositoryId,
      kind,
    );
    if (already) {
      return already._id;
    }

    await ctx.db.insert("contributions", {
      profileId: profile._id,
      repositoryId: args.repositoryId,
      title:
        kind === "next"
          ? `Next contribution in ${repo.fullName}`
          : `First contribution in ${repo.fullName}`,
      kind,
      status: "suggested",
    });
    const keeper = await collapseContributions(
      ctx,
      profile._id,
      args.repositoryId,
      kind,
    );
    return keeper?._id ?? null;
  },
});

export const markCompleted = mutation({
  args: {
    sessionId: v.string(),
    contributionId: v.id("contributions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const profile = await findProfile(ctx, {
      sessionId: args.sessionId,
      tokenIdentifier: identity?.tokenIdentifier,
    });
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
