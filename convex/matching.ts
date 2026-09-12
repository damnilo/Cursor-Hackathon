import { query } from "./_generated/server";
import { v } from "convex/values";
import { matchResultValidator, studentProfileFields } from "./lib/validators";
import { passesHardFilters, scoreRepository } from "./lib/scoring";

const DEFAULT_LIMIT = 5;
const CANDIDATE_LIMIT = 15;

export const matchRepos = query({
  args: {
    sessionId: v.optional(v.string()),
    profile: v.optional(v.object(studentProfileFields)),
    limit: v.optional(v.number()),
  },
  returns: v.array(matchResultValidator),
  handler: async (ctx, args) => {
    const profile = args.profile
      ? args.profile
      : args.sessionId
        ? await ctx.db
            .query("studentProfiles")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId!))
            .unique()
        : null;

    if (!profile) {
      return [];
    }

    const repos = await ctx.db.query("repositories").take(100);
    const ranked = repos
      .filter((repo) => passesHardFilters(profile, repo))
      .map((repo) => {
        const { score, reasons } = scoreRepository(profile, repo);
        return {
          repositoryId: repo._id,
          owner: repo.owner,
          name: repo.name,
          fullName: repo.fullName,
          url: repo.url,
          description: repo.description,
          primaryLanguage: repo.primaryLanguage,
          languages: repo.languages,
          topics: repo.topics,
          stack: repo.stack,
          hasGoodFirstIssues: repo.hasGoodFirstIssues,
          hasContributingGuide: repo.hasContributingGuide,
          difficulty: repo.difficulty,
          newcomerNote: repo.newcomerNote,
          stars: repo.stars,
          score,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score || b.stars - a.stars);

    const limit = Math.min(args.limit ?? DEFAULT_LIMIT, CANDIDATE_LIMIT);
    return ranked.slice(0, limit);
  },
});
