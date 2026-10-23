import { query } from "./_generated/server";
import { v } from "convex/values";
import { matchResultValidator } from "./lib/validators";
import { rankWithOfficialScore, type MatchProfile } from "./lib/scoring";

export const TEST_PROFILES: Array<{ name: string; profile: MatchProfile }> = [
  {
    name: "Maya — first PR ever",
    profile: {
      languages: ["Markdown", "JavaScript"],
      stack: [],
      topics: ["git", "beginner", "documentation"],
      level: "beginner",
      wantGoodFirstIssue: true,
    },
  },
  {
    name: "Luka — React / TypeScript student",
    profile: {
      languages: ["TypeScript", "JavaScript"],
      stack: ["React", "Next.js", "Tailwind"],
      topics: ["frontend", "react", "web"],
      level: "beginner",
      wantGoodFirstIssue: true,
    },
  },
  {
    name: "Ana — Python data science",
    profile: {
      languages: ["Python"],
      stack: ["Pandas", "NumPy"],
      topics: ["data-science", "machine-learning", "documentation"],
      level: "intermediate",
      wantGoodFirstIssue: false,
    },
  },
  {
    name: "Stefan — Go backend",
    profile: {
      languages: ["Go"],
      stack: ["Kubernetes"],
      topics: ["backend", "cli", "devops"],
      level: "intermediate",
      wantGoodFirstIssue: true,
    },
  },
  {
    name: "Iva — Rust beginner",
    profile: {
      languages: ["Rust"],
      stack: [],
      topics: ["cli", "compiler", "beginner"],
      level: "beginner",
      wantGoodFirstIssue: true,
    },
  },
];

const fixtureResult = v.object({
  name: v.string(),
  candidateCount: v.number(),
  matches: v.array(matchResultValidator),
});

export const runBaselineTests = query({
  args: {},
  returns: v.array(fixtureResult),
  handler: async (ctx) => {
    const repos = await ctx.db.query("repositories").take(100);

    return TEST_PROFILES.map(({ name, profile }) => {
      const ranked = rankWithOfficialScore(repos, profile);
      const matches = ranked.slice(0, 5).map((repo) => ({
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
          verified: true as const,
          score: repo.score,
          reasons: repo.reasons,
        }));

      return {
        name,
        candidateCount: ranked.length,
        matches,
      };
    });
  },
});
