// Catalog / facets / sample profiles only.
// UI must use `api.matching.matchRepos` — do not add AI ranking here.
import { mutation, query } from "./_generated/server";
import { Infer, v } from "convex/values";
import schema from "./schema";
import { SAMPLE_PROFILES } from "./data/sampleProfiles";
import { VERIFIED_REPOS } from "./data/verifiedRepos";
import { rankRepos, uniqueSorted } from "./lib/matching";
import {
  repositoryValidator,
  studentProfileValidator,
} from "./lib/validators";

type CatalogRepo = Infer<typeof repositoryValidator>;

const MAX_CATALOG = 80;

const matchResultValidator = schema.doc("repositories").extend({
  score: v.number(),
  reasons: v.array(v.string()),
});

const sampleProfileValidator = studentProfileValidator.extend({
  slug: v.string(),
  label: v.string(),
});

function readCatalogRepos(): CatalogRepo[] {
  return VERIFIED_REPOS.map((repo): CatalogRepo => ({
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    url: repo.url,
    description: repo.description,
    primaryLanguage: repo.primaryLanguage,
    languages: [...repo.languages],
    stack: [...repo.stack],
    topics: [...repo.topics],
    hasGoodFirstIssues: repo.hasGoodFirstIssues,
    hasContributingGuide: repo.hasContributingGuide,
    difficulty:
      repo.difficulty === "beginner" ? "beginner" : "intermediate",
    newcomerNote: repo.newcomerNote,
    stars: repo.stars,
    verified: true,
  }));
}

/**
 * Phase 2 API for the UI track:
 * - seedCatalog() once (idempotent)
 * - getFacets() for chip lists
 * - listSampleProfiles() for the "load sample" demo button
 * - matchRepos(profile) → top 3–5 scored repos
 */
export const seedCatalog = mutation({
  args: {},
  returns: v.object({
    repositoriesUpserted: v.number(),
    profilesUpserted: v.number(),
  }),
  handler: async (ctx) => {
    const repos = readCatalogRepos();
    let repositoriesUpserted = 0;

    for (const repo of repos) {
      const existing = await ctx.db
        .query("repositories")
        .withIndex("by_fullName", (q) => q.eq("fullName", repo.fullName))
        .unique();

      if (existing) {
        await ctx.db.patch("repositories", existing._id, repo);
      } else {
        await ctx.db.insert("repositories", repo);
      }
      repositoriesUpserted += 1;
    }

    let profilesUpserted = 0;
    for (const profile of SAMPLE_PROFILES) {
      const existing = await ctx.db
        .query("studentProfiles")
        .withIndex("by_slug", (q) => q.eq("slug", profile.slug))
        .unique();

      const doc = {
        slug: profile.slug,
        label: profile.label,
        languages: profile.languages,
        stack: profile.stack,
        topics: profile.topics,
        level: profile.level,
        wantGoodFirstIssue: profile.wantGoodFirstIssue,
        isFixture: true,
      };

      if (existing) {
        await ctx.db.patch("studentProfiles", existing._id, doc);
      } else {
        await ctx.db.insert("studentProfiles", doc);
      }
      profilesUpserted += 1;
    }

    return { repositoriesUpserted, profilesUpserted };
  },
});

export const getFacets = query({
  args: {},
  returns: v.object({
    languages: v.array(v.string()),
    stack: v.array(v.string()),
    topics: v.array(v.string()),
    repositoryCount: v.number(),
  }),
  handler: async (ctx) => {
    const repos = await ctx.db.query("repositories").take(MAX_CATALOG);
    const verified = repos.filter((repo) => repo.verified);

    return {
      languages: uniqueSorted(verified.flatMap((repo) => repo.languages)),
      stack: uniqueSorted(verified.flatMap((repo) => repo.stack)),
      topics: uniqueSorted(verified.flatMap((repo) => repo.topics)),
      repositoryCount: verified.length,
    };
  },
});

export const listSampleProfiles = query({
  args: {},
  returns: v.array(sampleProfileValidator),
  handler: async (ctx) => {
    const stored: Infer<typeof sampleProfileValidator>[] = [];
    for (const sample of SAMPLE_PROFILES) {
      const row = await ctx.db
        .query("studentProfiles")
        .withIndex("by_slug", (q) => q.eq("slug", sample.slug))
        .first();
      stored.push({
        slug: sample.slug,
        label: row?.label ?? sample.label,
        languages: row?.languages ?? sample.languages,
        stack: row?.stack ?? sample.stack,
        topics: row?.topics ?? sample.topics,
        level: row?.level ?? sample.level,
        wantGoodFirstIssue:
          row?.wantGoodFirstIssue ?? sample.wantGoodFirstIssue,
      });
    }
    return stored;
  },
});

export const matchRepos = query({
  args: studentProfileValidator.fields,
  returns: v.array(matchResultValidator),
  handler: async (ctx, profile) => {
    const repos = await ctx.db.query("repositories").take(MAX_CATALOG);
    const ranked = rankRepos(repos, profile, 5);

    return ranked.map(({ repo, score, reasons }) => ({
      ...repo,
      score,
      reasons,
    }));
  },
});

export const evaluateFixtures = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      label: v.string(),
      matchCount: v.number(),
      topFullNames: v.array(v.string()),
      topScores: v.array(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const repos = await ctx.db.query("repositories").take(MAX_CATALOG);
    return SAMPLE_PROFILES.map((profile) => {
      const ranked = rankRepos(repos, profile, 5);
      return {
        slug: profile.slug,
        label: profile.label,
        matchCount: ranked.length,
        topFullNames: ranked.map((item) => item.repo.fullName),
        topScores: ranked.map((item) => item.score),
      };
    });
  },
});
