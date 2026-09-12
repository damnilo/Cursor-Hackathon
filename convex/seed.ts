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
    let updated = 0;

    for (const repo of curated.repositories) {
      const existing = await ctx.db
        .query("repositories")
        .withIndex("by_fullName", (q) => q.eq("fullName", repo.fullName))
        .unique();

      const fields = {
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
      };

      if (existing) {
        await ctx.db.patch("repositories", existing._id, fields);
        updated += 1;
      } else {
        await ctx.db.insert("repositories", fields);
        inserted += 1;
      }
    }

    return {
      inserted,
      updated,
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
