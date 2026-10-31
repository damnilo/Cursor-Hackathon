"use node";

// Match order stays the deterministic shortlist. Grok is not called.
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Infer, v } from "convex/values";
import { matchResultValidator } from "../lib/validators";

type RankedMatch = Infer<typeof matchResultValidator>;

export const rankMatches = action({
  args: {
    sessionId: v.string(),
    visitId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(matchResultValidator),
  handler: async (ctx, args): Promise<RankedMatch[]> => {
    const candidates: RankedMatch[] = await ctx.runQuery(
      api.matching.matchRepos,
      {
        sessionId: args.sessionId,
        visitId: args.visitId,
        limit: 15,
      },
    );
    const limit = Math.min(args.limit ?? 5, 5);
    return candidates.slice(0, limit);
  },
});
