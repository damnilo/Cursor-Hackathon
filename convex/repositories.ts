// Catalog / facets / sample profiles only.
// UI must use `api.matching.matchRepos` — do not add AI ranking here.
import { mutation, query } from "./_generated/server";
import { Infer, v } from "convex/values";
import schema from "./schema";
import { syncCuratedRepositories } from "./lib/catalogSync";
import { SAMPLE_PROFILES } from "./data/sampleProfiles";
import { uniqueSorted } from "./lib/matching";
import { rankWithOfficialScore } from "./lib/scoring";
import { studentProfileValidator } from "./lib/validators";

const MAX_CATALOG = 80;

const matchResultValidator = schema.doc("repositories").extend({
  score: v.number(),
  reasons: v.array(v.string()),
});

const sampleProfileValidator = studentProfileValidator.extend({
  slug: v.string(),
  label: v.string(),
});

/**
 * Phase 2 API for the UI track:
 * - seedCatalog() once (idempotent). Repo rows go through the same upsert as
 *   `seed.seedRepositories`.
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
    const synced = await syncCuratedRepositories(ctx);
    const repositoriesUpserted = synced.inserted + synced.updated;

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
    if (profile.languages.length === 0) {
      return [];
    }
    const repos = await ctx.db.query("repositories").take(MAX_CATALOG);
    return rankWithOfficialScore(repos, profile).slice(0, 5);
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
      const ranked = rankWithOfficialScore(repos, profile).slice(0, 5);
      return {
        slug: profile.slug,
        label: profile.label,
        matchCount: ranked.length,
        topFullNames: ranked.map((item) => item.fullName),
        topScores: ranked.map((item) => item.score),
      };
    });
  },
});
