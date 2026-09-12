"use node";

// OWNER: colleague (AI). Rerank with Grok. Must keep runQuery(matching.matchRepos).
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Infer, v } from "convex/values";
import { matchResultValidator } from "../lib/validators";
import { grokJson } from "./lib/grok";

type RankedMatch = Infer<typeof matchResultValidator>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const rankMatches = action({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(matchResultValidator),
  handler: async (ctx, args): Promise<RankedMatch[]> => {
    const candidates: RankedMatch[] = await ctx.runQuery(
      api.matching.matchRepos,
      {
        sessionId: args.sessionId,
        limit: 15,
      },
    );
    const limit = Math.min(args.limit ?? 5, 5);
    if (candidates.length === 0) {
      return [];
    }

    const profile = await ctx.runQuery(api.profiles.getBySession, {
      sessionId: args.sessionId,
    });

    const grokResult = await grokJson(
      "You rerank beginner-friendly GitHub repos for one student. Return ONLY JSON: {\"order\":[\"owner/name\"],\"why\":{\"owner/name\":\"one sentence\"}}. order must be a subset of the given fullNames, best first.",
      JSON.stringify({
        profile: profile
          ? {
              languages: profile.languages,
              stack: profile.stack,
              topics: profile.topics,
              level: profile.level,
              wantGoodFirstIssue: profile.wantGoodFirstIssue,
            }
          : null,
        candidates: candidates.map((repo) => ({
          fullName: repo.fullName,
          score: repo.score,
          reasons: repo.reasons,
          difficulty: repo.difficulty,
          description: repo.description,
          hasGoodFirstIssues: repo.hasGoodFirstIssues,
        })),
      }),
    );

    if (!isRecord(grokResult) || !Array.isArray(grokResult.order)) {
      return candidates.slice(0, limit);
    }

    const byName = new Map(candidates.map((repo) => [repo.fullName, repo]));
    const why = isRecord(grokResult.why) ? grokResult.why : {};
    const ranked: RankedMatch[] = [];
    const seen = new Set<string>();

    for (const item of grokResult.order) {
      if (typeof item !== "string" || seen.has(item)) {
        continue;
      }
      const repo = byName.get(item);
      if (!repo) {
        continue;
      }
      seen.add(item);
      const reason = why[item];
      ranked.push({
        ...repo,
        reasons:
          typeof reason === "string" && reason.trim().length > 0
            ? [`AI: ${reason.trim()}`, ...repo.reasons]
            : repo.reasons,
      });
    }

    for (const repo of candidates) {
      if (!seen.has(repo.fullName)) {
        ranked.push(repo);
      }
    }

    return ranked.slice(0, limit);
  },
});
