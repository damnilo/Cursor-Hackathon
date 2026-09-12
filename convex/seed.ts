import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import curatedJson from "./data/verified-repos.json";

type CuratedRepo = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  primaryLanguage: string;
  languages: string[];
  topics: string[];
  stack: string[];
  hasGoodFirstIssues: boolean;
  hasContributingGuide: boolean;
  difficulty: "beginner" | "intermediate";
  newcomerNote: string;
  stars: number;
  verified: true;
};

const curated = curatedJson as {
  repositories: CuratedRepo[];
};

const seedResult = v.object({
  inserted: v.number(),
  updated: v.number(),
  total: v.number(),
});

export const seedRepositories = mutation({
  args: {},
  returns: seedResult,
  handler: async (ctx) => {
    let inserted = 0;
    const already = await ctx.db.query("repositories").take(80);
    const existingNames = new Set(already.map((repo) => repo.fullName));
    const missing = curated.repositories.filter(
      (repo) => !existingNames.has(repo.fullName),
    );
    if (missing.length === 0) {
      return {
        inserted: 0,
        updated: 0,
        total: curated.repositories.length,
      };
    }

    for (const repo of missing) {
      const existing = await ctx.db
        .query("repositories")
        .withIndex("by_fullName", (q) => q.eq("fullName", repo.fullName))
        .unique();
      if (existing) {
        continue;
      }

      await ctx.db.insert("repositories", {
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
      });
      inserted += 1;
    }

    return {
      inserted,
      updated: 0,
      total: curated.repositories.length,
    };
  },
});

export const repositoryCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const repos = await ctx.db.query("repositories").take(100);
    return repos.length;
  },
});
