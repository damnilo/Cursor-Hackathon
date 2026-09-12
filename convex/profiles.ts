import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { studentProfileFields } from "./lib/validators";

const profileDoc = v.object({
  _id: v.id("studentProfiles"),
  _creationTime: v.number(),
  slug: v.optional(v.string()),
  label: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  tokenIdentifier: v.optional(v.string()),
  cvStorageId: v.optional(v.id("_storage")),
  cvFileName: v.optional(v.string()),
  isFixture: v.optional(v.boolean()),
  updatedAt: v.optional(v.number()),
  ...studentProfileFields,
});

async function findProfile(
  ctx: QueryCtx | MutationCtx,
  args: { sessionId: string; tokenIdentifier?: string },
) {
  if (args.tokenIdentifier) {
    const byToken = await ctx.db
      .query("studentProfiles")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier!),
      )
      .unique();
    if (byToken) {
      return byToken;
    }
  }
  if (args.sessionId.trim().length === 0) {
    return null;
  }
  return await ctx.db
    .query("studentProfiles")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
    .unique();
}

export const upsert = mutation({
  args: {
    sessionId: v.string(),
    ...studentProfileFields,
  },
  returns: v.id("studentProfiles"),
  handler: async (ctx, args) => {
    if (args.sessionId.trim().length < 8) {
      throw new Error("Invalid session");
    }
    if (args.languages.length === 0) {
      throw new Error("Pick at least one language");
    }

    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier = identity?.tokenIdentifier;
    const existing = await findProfile(ctx, {
      sessionId: args.sessionId,
      tokenIdentifier,
    });

    const fields = {
      languages: args.languages,
      stack: args.stack,
      topics: args.topics,
      level: args.level,
      wantGoodFirstIssue: args.wantGoodFirstIssue,
      sessionId: args.sessionId,
      ...(tokenIdentifier ? { tokenIdentifier } : {}),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch("studentProfiles", existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("studentProfiles", fields);
  },
});

export const getBySession = query({
  args: { sessionId: v.string() },
  returns: v.union(profileDoc, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    return await findProfile(ctx, {
      sessionId: args.sessionId,
      tokenIdentifier: identity?.tokenIdentifier,
    });
  },
});

export const linkSession = mutation({
  args: { sessionId: v.string() },
  returns: v.union(v.id("studentProfiles"), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || args.sessionId.trim().length < 8) {
      return null;
    }

    const byToken = await ctx.db
      .query("studentProfiles")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    const bySession = await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (byToken) {
      if (!byToken.sessionId) {
        await ctx.db.patch("studentProfiles", byToken._id, {
          sessionId: args.sessionId,
          updatedAt: Date.now(),
        });
      }
      return byToken._id;
    }

    if (bySession) {
      await ctx.db.patch("studentProfiles", bySession._id, {
        tokenIdentifier: identity.tokenIdentifier,
        updatedAt: Date.now(),
      });
      return bySession._id;
    }

    return null;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveCv = mutation({
  args: {
    sessionId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.union(v.id("studentProfiles"), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const existing = await findProfile(ctx, {
      sessionId: args.sessionId,
      tokenIdentifier: identity?.tokenIdentifier,
    });
    if (!existing) {
      if (args.sessionId.trim().length < 8) {
        return null;
      }
      return await ctx.db.insert("studentProfiles", {
        sessionId: args.sessionId,
        ...(identity?.tokenIdentifier
          ? { tokenIdentifier: identity.tokenIdentifier }
          : {}),
        languages: [],
        stack: [],
        topics: [],
        level: "beginner",
        wantGoodFirstIssue: true,
        cvStorageId: args.storageId,
        cvFileName: args.fileName,
        updatedAt: Date.now(),
      });
    }
    await ctx.db.patch("studentProfiles", existing._id, {
      cvStorageId: args.storageId,
      cvFileName: args.fileName,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});
