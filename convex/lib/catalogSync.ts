import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import curatedJson from "../data/verified-repos.json";
import { findContributionByKind } from "./contributionLookup";

export type CuratedRepo = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  primaryLanguage: string;
  languages: string[];
  topics: string[];
  stack: string[];
  hasGoodFirstIssues: boolean;
  hasContributingGuide: boolean;
  difficulty: "beginner" | "intermediate";
  newcomerNote: string;
  stars: number;
  verified: true;
};

type CuratedFile = {
  version: number;
  curatedAt: string;
  repositories: CuratedRepo[];
};

const curated = curatedJson as CuratedFile;

export const CATALOG_KEY = "verified-repos" as const;

export type CatalogStamp = {
  version: number;
  curatedAt: string;
};

export type CatalogSyncResult = {
  inserted: number;
  updated: number;
  removedDuplicates: number;
  total: number;
  skipped: boolean;
};

export function catalogChanged(
  stored: CatalogStamp | null,
  next: CatalogStamp,
): boolean {
  if (!stored) {
    return true;
  }
  return stored.version !== next.version || stored.curatedAt !== next.curatedAt;
}

export function sameStringList(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

export function sameCuratedRepo(
  existing: CuratedRepo,
  next: CuratedRepo,
): boolean {
  return (
    existing.owner === next.owner &&
    existing.name === next.name &&
    existing.fullName === next.fullName &&
    existing.url === next.url &&
    existing.description === next.description &&
    existing.primaryLanguage === next.primaryLanguage &&
    sameStringList(existing.languages, next.languages) &&
    sameStringList(existing.topics, next.topics) &&
    sameStringList(existing.stack, next.stack) &&
    existing.hasGoodFirstIssues === next.hasGoodFirstIssues &&
    existing.hasContributingGuide === next.hasContributingGuide &&
    existing.difficulty === next.difficulty &&
    existing.newcomerNote === next.newcomerNote &&
    existing.stars === next.stars &&
    existing.verified === next.verified
  );
}

function toRepoFields(repo: CuratedRepo): CuratedRepo {
  return {
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    url: repo.url,
    description: repo.description,
    primaryLanguage: repo.primaryLanguage,
    languages: [...repo.languages],
    topics: [...repo.topics],
    stack: [...repo.stack],
    hasGoodFirstIssues: repo.hasGoodFirstIssues,
    hasContributingGuide: repo.hasContributingGuide,
    difficulty: repo.difficulty === "beginner" ? "beginner" : "intermediate",
    newcomerNote: repo.newcomerNote,
    stars: repo.stars,
    verified: true,
  };
}

async function readStamp(ctx: MutationCtx): Promise<CatalogStamp | null> {
  const row = await ctx.db
    .query("catalogMeta")
    .withIndex("by_key", (q) => q.eq("key", CATALOG_KEY))
    .first();
  if (!row) {
    return null;
  }
  return { version: row.version, curatedAt: row.curatedAt };
}

async function writeStamp(ctx: MutationCtx, stamp: CatalogStamp) {
  const existing = await ctx.db
    .query("catalogMeta")
    .withIndex("by_key", (q) => q.eq("key", CATALOG_KEY))
    .first();
  if (existing) {
    await ctx.db.patch("catalogMeta", existing._id, stamp);
    return;
  }
  await ctx.db.insert("catalogMeta", { key: CATALOG_KEY, ...stamp });
}

async function rowsForFullName(ctx: MutationCtx, fullName: string) {
  return await ctx.db
    .query("repositories")
    .withIndex("by_fullName", (q) => q.eq("fullName", fullName))
    .take(16);
}

async function repointContributions(
  ctx: MutationCtx,
  dropId: Id<"repositories">,
  keepId: Id<"repositories">,
) {
  for (let batch = 0; batch < 20; batch += 1) {
    const rows = await ctx.db
      .query("contributions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", dropId))
      .take(32);
    if (rows.length === 0) {
      return;
    }
    for (const row of rows) {
      const clash = row.profileId
        ? await findContributionByKind(ctx, row.profileId, keepId, row.kind)
        : null;
      if (!clash) {
        await ctx.db.patch("contributions", row._id, { repositoryId: keepId });
        continue;
      }
      await ctx.db.delete("contributions", row._id);
    }
  }
}

async function repointDocuments(
  ctx: MutationCtx,
  dropId: Id<"repositories">,
  keepId: Id<"repositories">,
) {
  const extras = await ctx.db
    .query("repoDocuments")
    .withIndex("by_repository", (q) => q.eq("repositoryId", dropId))
    .take(8);
  if (extras.length === 0) {
    return;
  }
  const keeper = await ctx.db
    .query("repoDocuments")
    .withIndex("by_repository", (q) => q.eq("repositoryId", keepId))
    .first();
  for (const extra of extras) {
    if (!keeper && extra._id === extras[0]?._id) {
      await ctx.db.patch("repoDocuments", extra._id, { repositoryId: keepId });
      continue;
    }
    await ctx.db.delete("repoDocuments", extra._id);
  }
}

async function collapseDuplicates(
  ctx: MutationCtx,
  rows: Doc<"repositories">[],
): Promise<{ keeper: Doc<"repositories">; removed: number }> {
  const ordered = [...rows].sort((a, b) => a._creationTime - b._creationTime);
  const keeper = ordered[0];
  if (!keeper) {
    throw new Error("Cannot collapse an empty repository set");
  }
  let removed = 0;
  for (const extra of ordered.slice(1)) {
    await repointContributions(ctx, extra._id, keeper._id);
    await repointDocuments(ctx, extra._id, keeper._id);
    await ctx.db.delete("repositories", extra._id);
    removed += 1;
  }
  return { keeper, removed };
}

/** Writes the JSON catalog into `repositories`. Callers decide whether a version check already passed. */
export async function syncCuratedRepositories(
  ctx: MutationCtx,
): Promise<CatalogSyncResult> {
  let inserted = 0;
  let updated = 0;
  let removedDuplicates = 0;

  for (const source of curated.repositories) {
    const fields = toRepoFields(source);
    const matches = await rowsForFullName(ctx, fields.fullName);
    if (matches.length === 0) {
      await ctx.db.insert("repositories", fields);
      inserted += 1;
      continue;
    }

    const { keeper, removed } = await collapseDuplicates(ctx, matches);
    removedDuplicates += removed;
    if (typeof keeper.goodFirstIssueCount === "number") {
      fields.hasGoodFirstIssues = keeper.goodFirstIssueCount > 0;
    }
    if (!sameCuratedRepo(keeper, fields)) {
      await ctx.db.patch("repositories", keeper._id, fields);
      updated += 1;
    }
  }

  await writeStamp(ctx, {
    version: curated.version,
    curatedAt: curated.curatedAt,
  });

  return {
    inserted,
    updated,
    removedDuplicates,
    total: curated.repositories.length,
    skipped: false,
  };
}

/** Page-load seed. Skips the 58 writes when the stored catalog stamp matches the JSON. */
export async function syncCuratedRepositoriesIfChanged(
  ctx: MutationCtx,
): Promise<CatalogSyncResult> {
  const stored = await readStamp(ctx);
  const next = { version: curated.version, curatedAt: curated.curatedAt };
  if (!catalogChanged(stored, next)) {
    return {
      inserted: 0,
      updated: 0,
      removedDuplicates: 0,
      total: curated.repositories.length,
      skipped: true,
    };
  }
  return await syncCuratedRepositories(ctx);
}
