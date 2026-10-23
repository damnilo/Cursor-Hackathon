import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import type { contributionKindValidator } from "./validators";

type Kind = Infer<typeof contributionKindValidator>;

/** One plan per profile, repo, and kind. `.first()` until a unique index exists. */
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
  return rows[0] ?? null;
}
