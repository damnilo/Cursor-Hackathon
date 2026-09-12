"use node";

// OWNER: colleague (AI). Rerank with Grok. Must keep runQuery(matching.matchRepos).
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { matchResultValidator } from "../lib/validators";
import { Infer } from "convex/values";

type RankedMatch = Infer<typeof matchResultValidator>;

export const rankMatches = action({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(matchResultValidator),
  handler: async (ctx, args): Promise<RankedMatch[]> => {
    const candidates = await ctx.runQuery(api.matching.matchRepos, {
      sessionId: args.sessionId,
      limit: 15,
    });
    const limit = Math.min(args.limit ?? 5, 5);
    return candidates.slice(0, limit);
  },
});
