import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { AI_HOURLY_LIMIT, AI_WINDOW_MS, nextQuota } from "../lib/aiQuota";

const kind = v.union(
  v.literal("rerank"),
  v.literal("plan"),
  v.literal("parse"),
  v.literal("normalize"),
);

export const status = internalQuery({
  args: {
    profileId: v.id("studentProfiles"),
    kind,
  },
  returns: v.object({ allowed: v.boolean() }),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("aiUsage")
      .withIndex("by_profile_and_kind", (q) =>
        q.eq("profileId", args.profileId).eq("kind", args.kind),
      )
      .first();
    const decision = nextQuota(
      row ? { count: row.count, windowStartedAt: row.windowStartedAt } : null,
      Date.now(),
      AI_HOURLY_LIMIT,
      AI_WINDOW_MS,
    );
    return { allowed: decision.allowed };
  },
});

export const consume = internalMutation({
  args: {
    profileId: v.id("studentProfiles"),
    kind,
  },
  returns: v.object({ allowed: v.boolean() }),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("aiUsage")
      .withIndex("by_profile_and_kind", (q) =>
        q.eq("profileId", args.profileId).eq("kind", args.kind),
      )
      .take(8);
    const ordered = [...rows].sort((a, b) => a._creationTime - b._creationTime);
    const current = ordered[0] ?? null;
    for (const extra of ordered.slice(1)) {
      await ctx.db.delete("aiUsage", extra._id);
    }
    const decision = nextQuota(
      current
        ? { count: current.count, windowStartedAt: current.windowStartedAt }
        : null,
      Date.now(),
      AI_HOURLY_LIMIT,
      AI_WINDOW_MS,
    );
    if (current) {
      await ctx.db.patch("aiUsage", current._id, decision.next);
    } else if (decision.allowed) {
      await ctx.db.insert("aiUsage", {
        profileId: args.profileId,
        kind: args.kind,
        ...decision.next,
      });
    }
    return { allowed: decision.allowed };
  },
});
