import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { studentProfileFields } from "./lib/validators";

const profileDoc = v.object({
  _id: v.id("studentProfiles"),
  _creationTime: v.number(),
  sessionId: v.optional(v.string()),
  tokenIdentifier: v.optional(v.string()),
  slug: v.optional(v.string()),
  label: v.optional(v.string()),
  isFixture: v.optional(v.boolean()),
  updatedAt: v.optional(v.number()),
  cvStorageId: v.optional(v.id("_storage")),
  cvFileName: v.optional(v.string()),
  ...studentProfileFields,
});

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

    const existing = await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    const fields = {
      languages: args.languages,
      stack: args.stack,
      topics: args.topics,
      level: args.level,
      wantGoodFirstIssue: args.wantGoodFirstIssue,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch("studentProfiles", existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("studentProfiles", {
      sessionId: args.sessionId,
      ...fields,
    });
  },
});

export const getBySession = query({
  args: { sessionId: v.string() },
  returns: v.union(profileDoc, v.null()),
  handler: async (ctx, args) => {
    if (args.sessionId.trim().length === 0) {
      return null;
    }

    return await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});
