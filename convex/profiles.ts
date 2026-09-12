import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { studentProfileFields } from "./lib/validators";
import type { Doc, Id } from "./_generated/dataModel";

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

async function lookupByToken(
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string,
) {
  return await ctx.db
    .query("studentProfiles")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .first();
}

async function lookupBySession(
  ctx: QueryCtx | MutationCtx,
  sessionId: string,
) {
  if (sessionId.trim().length === 0) {
    return [];
  }
  return await ctx.db
    .query("studentProfiles")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .take(8);
}

export async function findProfile(
  ctx: QueryCtx | MutationCtx,
  args: { sessionId: string; tokenIdentifier?: string },
) {
  if (args.tokenIdentifier) {
    const byToken = await lookupByToken(ctx, args.tokenIdentifier);
    if (byToken) {
      return byToken;
    }
  }
  const bySession = await lookupBySession(ctx, args.sessionId);
  return bySession[0] ?? null;
}

async function rehomeContributions(
  ctx: MutationCtx,
  fromId: Id<"studentProfiles">,
  toId: Id<"studentProfiles">,
) {
  if (fromId === toId) {
    return;
  }
  const rows = await ctx.db
    .query("contributions")
    .withIndex("by_profile", (q) => q.eq("profileId", fromId))
    .take(50);
  for (const row of rows) {
    const clash = await ctx.db
      .query("contributions")
      .withIndex("by_profile_and_repo", (q) =>
        q.eq("profileId", toId).eq("repositoryId", row.repositoryId),
      )
      .first();
    if (!clash) {
      await ctx.db.patch("contributions", row._id, { profileId: toId });
      continue;
    }
    const guestWins =
      (row.status === "completed" && clash.status !== "completed") ||
      ((row.steps?.length ?? 0) > (clash.steps?.length ?? 0) &&
        clash.status !== "completed");
    if (guestWins) {
      await ctx.db.patch("contributions", clash._id, {
        title: row.title,
        issueUrl: row.issueUrl,
        whyThisIssue: row.whyThisIssue,
        steps: row.steps,
        skills: row.skills,
        timeEstimate: row.timeEstimate,
        kind: row.kind,
        status: row.status,
        completedAt: row.completedAt,
      });
    }
    await ctx.db.delete("contributions", row._id);
  }
}

async function retireGuestRow(
  ctx: MutationCtx,
  guest: Doc<"studentProfiles">,
) {
  if (guest.slug || guest.isFixture) {
    await ctx.db.replace("studentProfiles", guest._id, {
      languages: guest.languages,
      stack: guest.stack,
      topics: guest.topics,
      level: guest.level,
      wantGoodFirstIssue: guest.wantGoodFirstIssue,
      updatedAt: Date.now(),
      ...(guest.slug ? { slug: guest.slug } : {}),
      ...(guest.label ? { label: guest.label } : {}),
      ...(guest.tokenIdentifier
        ? { tokenIdentifier: guest.tokenIdentifier }
        : {}),
      ...(guest.cvStorageId ? { cvStorageId: guest.cvStorageId } : {}),
      ...(guest.cvFileName ? { cvFileName: guest.cvFileName } : {}),
      ...(guest.isFixture ? { isFixture: guest.isFixture } : {}),
    });
    return;
  }
  await ctx.db.delete("studentProfiles", guest._id);
}

async function mergeGuestIntoCanonical(
  ctx: MutationCtx,
  canonical: Doc<"studentProfiles">,
  guest: Doc<"studentProfiles">,
) {
  if (canonical._id === guest._id) {
    return canonical;
  }

  const chipPatch =
    guest.languages.length > 0 && canonical.languages.length === 0
      ? {
          languages: guest.languages,
          stack: guest.stack,
          topics: guest.topics,
          level: guest.level,
          wantGoodFirstIssue: guest.wantGoodFirstIssue,
        }
      : {};
  const cvPatch =
    guest.cvStorageId && !canonical.cvStorageId
      ? {
          cvStorageId: guest.cvStorageId,
          cvFileName: guest.cvFileName,
        }
      : {};

  if (Object.keys(chipPatch).length > 0 || Object.keys(cvPatch).length > 0) {
    await ctx.db.patch("studentProfiles", canonical._id, {
      ...chipPatch,
      ...cvPatch,
      updatedAt: Date.now(),
    });
  }

  await rehomeContributions(ctx, guest._id, canonical._id);
  await retireGuestRow(ctx, guest);
  const next = await ctx.db.get("studentProfiles", canonical._id);
  return next ?? canonical;
}

/**
 * One browser session + optional Google identity → one profile row.
 * Moves guest chips / CV / plans onto the token row and never leaves
 * two documents sharing the same sessionId (that breaks .unique()).
 */
async function attachIdentity(
  ctx: MutationCtx,
  sessionId: string,
  tokenIdentifier: string | undefined,
): Promise<Doc<"studentProfiles"> | null> {
  const tokenRow = tokenIdentifier
    ? await lookupByToken(ctx, tokenIdentifier)
    : null;
  const sessionRows = await lookupBySession(ctx, sessionId);
  const canonical = tokenRow ?? sessionRows[0] ?? null;
  if (!canonical) {
    return null;
  }

  let current = canonical;
  for (const row of sessionRows) {
    if (row._id !== current._id) {
      current = await mergeGuestIntoCanonical(ctx, current, row);
    }
  }

  const patch: {
    sessionId: string;
    tokenIdentifier?: string;
    updatedAt: number;
  } = {
    sessionId,
    updatedAt: Date.now(),
  };
  if (tokenIdentifier && current.tokenIdentifier !== tokenIdentifier) {
    patch.tokenIdentifier = tokenIdentifier;
  }
  if (current.sessionId !== sessionId || patch.tokenIdentifier) {
    await ctx.db.patch("studentProfiles", current._id, patch);
  }

  return (await ctx.db.get("studentProfiles", current._id)) ?? current;
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
    const existing = await attachIdentity(ctx, args.sessionId, tokenIdentifier);

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
    const attached = await attachIdentity(
      ctx,
      args.sessionId,
      identity.tokenIdentifier,
    );
    return attached?._id ?? null;
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
    const existing = await attachIdentity(
      ctx,
      args.sessionId,
      identity?.tokenIdentifier,
    );
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
