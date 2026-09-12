"use node";

// OWNER: colleague (AI). Replace ensureSuggested with Grok first/next plans.
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { contributionKindValidator } from "../lib/validators";
import { Id } from "../_generated/dataModel";

export const generateContribution = action({
  args: {
    sessionId: v.string(),
    repositoryId: v.id("repositories"),
    kind: v.optional(contributionKindValidator),
  },
  returns: v.union(v.id("contributions"), v.null()),
  handler: async (ctx, args): Promise<Id<"contributions"> | null> => {
    return await ctx.runMutation(api.contributions.ensureSuggested, {
      sessionId: args.sessionId,
      repositoryId: args.repositoryId,
      kind: args.kind,
    });
  },
});
