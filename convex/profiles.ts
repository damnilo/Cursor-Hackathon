import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import {
  guestChipsWin,
  isMergeableGuest,
  preferGuestCv,
  sessionOwnedByOther,
  visibleSessionRow,
} from "./lib/profileAccess";
import { studentProfileFields } from "./lib/validators";
import type { Doc, Id } from "./_generated/dataModel";
import { findContributionByKind } from "./lib/contributionLookup";

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
  const rows: Doc<"studentProfiles">[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10; page += 1) {
    const result = await ctx.db
      .query("studentProfiles")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .paginate({ numItems: 32, cursor });
    rows.push(...result.page);
    if (result.isDone) {
      break;
    }
    cursor = result.continueCursor;
  }
  return rows;
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
  return (
    bySession.find((row) => visibleSessionRow(row, args.tokenIdentifier)) ??
    null
  );
}

async function rehomeContributions(
  ctx: MutationCtx,
  fromId: Id<"studentProfiles">,
  toId: Id<"studentProfiles">,
) {
  if (fromId === toId) {
    return;
  }
  const seen = new Set<string>();
  while (seen.size < 500) {
    const rows = await ctx.db
      .query("contributions")
      .withIndex("by_profile", (q) => q.eq("profileId", fromId))
      .take(32);
    if (rows.length === 0) {
      break;
    }
    let moved = 0;
    for (const row of rows) {
      if (seen.has(row._id)) {
        continue;
      }
      seen.add(row._id);
      moved += 1;
      await moveContribution(ctx, row, toId);
    }
    if (moved === 0) {
      break;
    }
  }
}

async function moveContribution(
  ctx: MutationCtx,
  row: Doc<"contributions">,
  toId: Id<"studentProfiles">,
) {
  const clash = await findContributionByKind(
    ctx,
    toId,
    row.repositoryId,
    row.kind,
  );
  if (!clash) {
    await ctx.db.patch("contributions", row._id, { profileId: toId });
    return;
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
      profileUpdatedAt: row.profileUpdatedAt,
    });
  }
  await ctx.db.delete("contributions", row._id);
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

  const chipPatch = guestChipsWin(canonical, guest)
    ? {
        languages: guest.languages,
        stack: guest.stack,
        topics: guest.topics,
        level: guest.level,
        wantGoodFirstIssue: guest.wantGoodFirstIssue,
      }
    : {};
  const useGuestCv = preferGuestCv(canonical, guest);
  const cvPatch =
    useGuestCv && guest.cvStorageId
      ? {
          cvStorageId: guest.cvStorageId,
          cvFileName: guest.cvFileName,
        }
      : {};
  if (
    canonical.cvStorageId &&
    useGuestCv &&
    canonical.cvStorageId !== guest.cvStorageId
  ) {
    await deleteStorage(ctx, canonical.cvStorageId);
  }
  if (
    guest.cvStorageId &&
    !useGuestCv &&
    guest.cvStorageId !== canonical.cvStorageId
  ) {
    await deleteStorage(ctx, guest.cvStorageId);
  }

  if (Object.keys(chipPatch).length > 0 || Object.keys(cvPatch).length > 0) {
    await ctx.db.patch("studentProfiles", canonical._id, {
      ...chipPatch,
      ...cvPatch,
      updatedAt: Date.now(),
      ...(Object.keys(chipPatch).length > 0 ? { rerank: [] } : {}),
    });
  }

  await rehomeContributions(ctx, guest._id, canonical._id);
  await retireGuestRow(ctx, guest);
  const next = await ctx.db.get("studentProfiles", canonical._id);
  return next ?? canonical;
}

async function deleteStorage(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
) {
  try {
    await ctx.storage.delete(storageId);
  } catch (error) {
    console.error("Could not delete replaced CV", error);
  }
}

/**
 * Links a guest browser to the signed-in Google profile.
 * A sessionId never opens or rewrites a row that already belongs to a different account.
 */
async function attachIdentity(
  ctx: MutationCtx,
  sessionId: string,
  tokenIdentifier: string | undefined,
): Promise<Doc<"studentProfiles"> | null> {
  const sessionRows = await lookupBySession(ctx, sessionId);
  const tokenRow = tokenIdentifier
    ? await lookupByToken(ctx, tokenIdentifier)
    : null;

  if (sessionOwnedByOther(sessionRows, tokenIdentifier)) {
    return tokenRow;
  }

  const guests = sessionRows.filter(
    (row) => row._id !== tokenRow?._id && isMergeableGuest(row),
  );
  let current = tokenRow ?? guests[0] ?? null;
  if (!current) {
    return null;
  }

  for (const guest of guests) {
    if (guest._id === current._id) {
      continue;
    }
    current = await mergeGuestIntoCanonical(ctx, current, guest);
  }

  const patch: {
    sessionId?: string;
    tokenIdentifier?: string;
    updatedAt: number;
  } = { updatedAt: Date.now() };
  let changed = false;
  if (
    current.sessionId !== sessionId &&
    (!current.tokenIdentifier || current.tokenIdentifier === tokenIdentifier)
  ) {
    patch.sessionId = sessionId;
    changed = true;
  }
  if (tokenIdentifier && !current.tokenIdentifier) {
    patch.tokenIdentifier = tokenIdentifier;
    changed = true;
  }
  if (changed) {
    await ctx.db.patch("studentProfiles", current._id, patch);
  }

  return (await ctx.db.get("studentProfiles", current._id)) ?? current;
}

async function assertSessionWritable(
  ctx: MutationCtx,
  sessionId: string,
  tokenIdentifier: string | undefined,
) {
  const sessionRows = await lookupBySession(ctx, sessionId);
  if (sessionOwnedByOther(sessionRows, tokenIdentifier)) {
    throw new Error("Unauthorized");
  }
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
    await assertSessionWritable(ctx, args.sessionId, tokenIdentifier);
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
      rerank: [],
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
  args: { sessionId: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (args.sessionId.trim().length < 8) {
      throw new Error("Unauthorized");
    }
    const identity = await ctx.auth.getUserIdentity();
    await assertSessionWritable(ctx, args.sessionId, identity?.tokenIdentifier);
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
    const tokenIdentifier = identity?.tokenIdentifier;
    await assertSessionWritable(ctx, args.sessionId, tokenIdentifier);
    const existing = await attachIdentity(
      ctx,
      args.sessionId,
      tokenIdentifier,
    );
    if (!existing) {
      if (args.sessionId.trim().length < 8) {
        return null;
      }
      return await ctx.db.insert("studentProfiles", {
        sessionId: args.sessionId,
        ...(tokenIdentifier ? { tokenIdentifier } : {}),
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
    // CV text is not a chip change. Plans and the saved rerank follow updatedAt from upsert.
    await ctx.db.patch("studentProfiles", existing._id, {
      cvStorageId: args.storageId,
      cvFileName: args.fileName,
    });
    if (existing.cvStorageId && existing.cvStorageId !== args.storageId) {
      await deleteStorage(ctx, existing.cvStorageId);
    }
    return existing._id;
  },
});
