"use node";

// OWNER: colleague (AI). Replace ensureSuggested with Grok first/next plans.
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Infer, v } from "convex/values";
import { contributionKindValidator } from "../lib/validators";
import { grokJson } from "./lib/grok";
import { loadRepoDocs } from "./lib/docs";
import { Id } from "../_generated/dataModel";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

type Kind = Infer<typeof contributionKindValidator>;

export const generateContribution = action({
  args: {
    sessionId: v.string(),
    repositoryId: v.id("repositories"),
    kind: v.optional(contributionKindValidator),
  },
  returns: v.union(v.id("contributions"), v.null()),
  handler: async (ctx, args): Promise<Id<"contributions"> | null> => {
    const kind: Kind = args.kind ?? "first";
    const contributionId = await ctx.runMutation(
      api.contributions.ensureSuggested,
      {
        sessionId: args.sessionId,
        repositoryId: args.repositoryId,
        kind,
      },
    );
    if (!contributionId) {
      return null;
    }

    const profile = await ctx.runQuery(api.profiles.getBySession, {
      sessionId: args.sessionId,
    });
    const repo = await ctx.runQuery(internal.ai.store.getRepository, {
      repositoryId: args.repositoryId,
    });
    if (!profile || !repo) {
      return contributionId;
    }

    const docs = await loadRepoDocs(ctx, args.repositoryId);

    const grokResult = await grokJson(
      "You write a concrete first open-source contribution plan for a student. Return ONLY JSON with keys title, issueUrl, whyThisIssue (one sentence: why this issue fits the student), steps (array of 4-7 short steps), skills (array), timeEstimate (string like '2-4 hours'). issueUrl may be empty.",
      JSON.stringify({
        kind,
        student: {
          languages: profile.languages,
          stack: profile.stack,
          topics: profile.topics,
          level: profile.level,
        },
        repo: {
          fullName: repo.fullName,
          url: repo.url,
          description: repo.description,
          newcomerNote: repo.newcomerNote,
          hasGoodFirstIssues: repo.hasGoodFirstIssues,
        },
        readme: docs?.readmeMarkdown?.slice(0, 6000) ?? null,
        contributing: docs?.contributingMarkdown?.slice(0, 4000) ?? null,
      }),
    );

    if (!isRecord(grokResult)) {
      return contributionId;
    }

    const title =
      typeof grokResult.title === "string" && grokResult.title.trim().length > 0
        ? grokResult.title.trim()
        : `First contribution in ${repo.fullName}`;
    const steps = asStringArray(grokResult.steps).slice(0, 8);
    const skills = asStringArray(grokResult.skills).slice(0, 8);
    const issueUrl =
      typeof grokResult.issueUrl === "string" &&
      grokResult.issueUrl.startsWith("http")
        ? grokResult.issueUrl
        : undefined;
    const timeEstimate =
      typeof grokResult.timeEstimate === "string" &&
      grokResult.timeEstimate.trim().length > 0
        ? grokResult.timeEstimate.trim()
        : "2-4 hours";

    const whyThisIssue =
      typeof grokResult.whyThisIssue === "string" &&
      grokResult.whyThisIssue.trim().length > 0
        ? grokResult.whyThisIssue.trim()
        : undefined;

    await ctx.runMutation(internal.ai.store.applyContributionPlan, {
      contributionId,
      title,
      issueUrl,
      whyThisIssue,
      steps:
        steps.length > 0
          ? steps
          : [
              `Read ${repo.fullName} README`,
              "Find a good first issue or docs typo",
              "Fork, branch, and open a small PR",
            ],
      skills: skills.length > 0 ? skills : profile.languages,
      timeEstimate,
      kind,
    });

    return contributionId;
  },
});
