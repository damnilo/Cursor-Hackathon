"use node";

// OWNER: colleague (AI). Replace the passthrough with Grok normalization.
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { studentProfileFields } from "../lib/validators";

type NormalizedProfile = {
  languages: string[];
  stack: string[];
  topics: string[];
  level: "beginner" | "intermediate";
  wantGoodFirstIssue: boolean;
};

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
