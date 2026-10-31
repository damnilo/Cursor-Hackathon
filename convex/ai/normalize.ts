"use node";

// Chips stay as the student saved them. Grok is not called.
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Infer, v } from "convex/values";
import { studentProfileFields, studentProfileValidator } from "../lib/validators";

type NormalizedProfile = Infer<typeof studentProfileValidator>;

export const normalizeProfile = action({
  args: { sessionId: v.string() },
  returns: v.union(v.object(studentProfileFields), v.null()),
  handler: async (ctx, args): Promise<NormalizedProfile | null> => {
    const profile = await ctx.runQuery(api.profiles.getBySession, {
      sessionId: args.sessionId,
    });
    if (!profile) {
      return null;
    }
    return {
      languages: profile.languages,
      stack: profile.stack,
      topics: profile.topics,
      level: profile.level,
      wantGoodFirstIssue: profile.wantGoodFirstIssue,
    };
  },
});
