"use node";

// OWNER: colleague (AI). Replace the passthrough with Grok normalization.
import { action } from "../_generated/server";
import { api } from "../_generated/api";
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

    const grokResult = await grokJson(
      "You normalize student profiles for an open-source matching app. Return ONLY JSON.",
      JSON.stringify({
        profile: fallback,
        allowedLanguages: LANGUAGE_OPTIONS,
        allowedStack: STACK_OPTIONS,
        allowedTopics: TOPIC_OPTIONS,
        instructions:
          "Map synonyms onto allowed lists. Do not invent chips outside the lists. Keep level as beginner or intermediate. Keep wantGoodFirstIssue boolean.",
      }),
    );

    if (!isRecord(grokResult)) {
      return fallback;
    }

    const languages = pickAllowed(
      asStringArray(grokResult.languages).length > 0
        ? asStringArray(grokResult.languages)
        : fallback.languages,
      "languages",
    );
    const stack = pickAllowed(
      asStringArray(grokResult.stack).length > 0
        ? asStringArray(grokResult.stack)
        : fallback.stack,
      "stack",
    );
    const topics = pickAllowed(
      asStringArray(grokResult.topics).length > 0
        ? asStringArray(grokResult.topics)
        : fallback.topics,
      "topics",
    );

    const normalized: NormalizedProfile = {
      languages: languages.length > 0 ? languages : fallback.languages,
      stack,
      topics,
      level:
        grokResult.level === "intermediate" ? "intermediate" : fallback.level,
      wantGoodFirstIssue:
        typeof grokResult.wantGoodFirstIssue === "boolean"
          ? grokResult.wantGoodFirstIssue
          : fallback.wantGoodFirstIssue,
    };

    await ctx.runMutation(api.profiles.upsert, {
      sessionId: args.sessionId,
      ...normalized,
    });

    return normalized;
  },
});
