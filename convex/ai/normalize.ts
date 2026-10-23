"use node";

// OWNER: colleague (AI). Replace the passthrough with Grok normalization.
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Infer, v } from "convex/values";
import {
  studentProfileFields,
  studentProfileValidator,
} from "../lib/validators";
import { grokJson } from "./lib/grok";
import {
  LANGUAGE_OPTIONS,
  pickAllowed,
  STACK_OPTIONS,
  TOPIC_OPTIONS,
} from "./lib/catalog";

type NormalizedProfile = Infer<typeof studentProfileValidator>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

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

    const fallback: NormalizedProfile = {
      languages: profile.languages,
      stack: profile.stack,
      topics: profile.topics,
      level: profile.level,
      wantGoodFirstIssue: profile.wantGoodFirstIssue,
    };

    const quota = await ctx.runMutation(internal.ai.usage.consume, {
      profileId: profile._id,
      kind: "normalize",
    });
    if (!quota.allowed) {
      return fallback;
    }

    const grokResult = await grokJson(
      "You normalize student profiles for an open-source matching app. Return ONLY JSON.",
      JSON.stringify({
        profile: fallback,
        allowedLanguages: LANGUAGE_OPTIONS,
        allowedStack: STACK_OPTIONS,
        allowedTopics: TOPIC_OPTIONS,
        instructions:
          "You may append stack and topic synonyms from the allowed lists. Do not reorder languages. Do not change level or wantGoodFirstIssue.",
      }),
    );

    if (!isRecord(grokResult)) {
      return fallback;
    }

    const normalized: NormalizedProfile = {
      languages: pickAllowed(fallback.languages, "languages"),
      stack: pickAllowed(
        [...fallback.stack, ...asStringArray(grokResult.stack)],
        "stack",
      ),
      topics: pickAllowed(
        [...fallback.topics, ...asStringArray(grokResult.topics)],
        "topics",
      ),
      level: fallback.level,
      wantGoodFirstIssue: fallback.wantGoodFirstIssue,
    };

    return normalized;
  },
});
