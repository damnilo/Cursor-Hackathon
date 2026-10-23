import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import type { contributionKindValidator } from "./validators";

type Kind = Infer<typeof contributionKindValidator>;

/** One plan per profile, repo, and kind. Reads use the oldest row. */
export async function findContributionByKind(
  ctx: { db: QueryCtx["db"] },
  profileId: Id<"studentProfiles">,
  repositoryId: Id<"repositories">,
  kind: Kind,
) {
  const rows = await ctx.db
    .query("contributions")
    .withIndex("by_profile_repo_and_kind", (q) =>
      q
        .eq("profileId", profileId)
        .eq("repositoryId", repositoryId)
        .eq("kind", kind),
    )
    .take(8);
  const ordered = [...rows].sort((a, b) => a._creationTime - b._creationTime);
  return ordered[0] ?? null;
}

/** Convex 1.45 has no unique index, so the writer drops every newer duplicate. */
export async function collapseContributions(
  ctx: { db: MutationCtx["db"] },
  profileId: Id<"studentProfiles">,
  repositoryId: Id<"repositories">,
  kind: Kind,
): Promise<Doc<"contributions"> | null> {
  const rows = await ctx.db
    .query("contributions")
    .withIndex("by_profile_repo_and_kind", (q) =>
      q
        .eq("profileId", profileId)
        .eq("repositoryId", repositoryId)
        .eq("kind", kind),
    )
    .take(16);
  const ordered = [...rows].sort((a, b) => a._creationTime - b._creationTime);
  const keeper = ordered[0];
  if (!keeper) {
    return null;
  }
  for (const extra of ordered.slice(1)) {
    await ctx.db.delete("contributions", extra._id);
  }
  return keeper;
}
