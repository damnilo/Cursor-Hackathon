"use node";

// OWNER: colleague (AI). Replace ensureSuggested with Grok first/next plans.
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Infer, v } from "convex/values";
import { contributionKindValidator } from "../lib/validators";
import { grokJson } from "./lib/grok";
import { loadRepoDocs } from "./lib/docs";
import {
  fetchBeginnerIssues,
  pickAllowedIssueUrl,
  type GithubIssue,
} from "./lib/githubIssues";
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

function isVagueStep(step: string): boolean {
  const text = step.trim();
  return (
    /find a good first issue/i.test(text) ||
    /read( the)? (repo )?(guide|readme|contributing)/i.test(text) ||
    /open .+ README\.md and CONTRIBUTING/i.test(text) ||
    /pick a docs or comment typo/i.test(text)
  );
}

function concreteFallbackSteps(
  repoFullName: string,
  issue: GithubIssue | undefined,
): string[] {
  if (issue) {
    const gap =
      issue.body.length > 0
        ? issue.body.slice(0, 220)
        : issue.title;
    return [
      `Issue #${issue.number} (${issue.title}): ${gap}`,
      `Open ${issue.html_url} and note the files, docs page, or behavior named in the description.`,
      `Fork ${repoFullName}, clone your fork, and create branch fix/${issue.number}-first-contrib.`,
      `Make the smallest change that closes the gap above — quote the missing or wrong text in the PR.`,
      `PR title: "Fix #${issue.number}: ${issue.title.slice(0, 70)}". PR body: what was wrong, what you changed, and ${issue.html_url}.`,
      `Run the lint or test command mentioned in CONTRIBUTING or package.json, then commit and open the PR.`,
    ];
  }
  return [
    `Open ${repoFullName} README.md and CONTRIBUTING.md (or the contributing section linked from the README).`,
    `Fork ${repoFullName}, then run: git clone <your-fork-url> && cd ${repoFullName.split("/")[1]}`,
    `Create a branch: git checkout -b docs/${repoFullName.split("/")[1]}-typo`,
    `Pick a docs or comment typo in README.md or docs/ — do not invent a GitHub issue URL.`,
    `Run the project's documented lint or markdown check if CONTRIBUTING.md lists one.`,
    `Commit with: git commit -m "docs: fix typo in README.md"`,
    `Push the branch and open a pull request that describes the file you changed.`,
    `In the PR body, quote the CONTRIBUTING.md section you followed.`,
  ];
}

function enforceSteps(
  raw: string[],
  repoFullName: string,
  issue: GithubIssue | undefined,
): string[] {
  const cleaned = raw
    .map((step) => step.trim())
    .filter((step) => step.length > 0 && !isVagueStep(step));
  const fallback = concreteFallbackSteps(repoFullName, issue);
  const merged = [...cleaned];
  for (const step of fallback) {
    if (merged.length >= 6) {
      break;
    }
    if (!merged.includes(step)) {
      merged.push(step);
    }
  }
  if (merged.length < 6) {
    merged.push(...fallback.slice(merged.length, 6));
  }
  return merged.slice(0, 8);
}

function enforceSkills(raw: string[], profileSkills: string[]): string[] {
  const cleaned = raw.map((skill) => skill.trim()).filter(Boolean);
  if (cleaned.length > 0) {
    return cleaned.slice(0, 8);
  }
  const fromProfile = profileSkills.map((skill) => skill.trim()).filter(Boolean);
  return fromProfile.length > 0 ? fromProfile.slice(0, 8) : ["git", "GitHub"];
}

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
    const issues = await fetchBeginnerIssues(repo.owner, repo.name);
    const allowedUrls = issues.map((issue) => issue.html_url);

    const grokResult = await grokJson(
      [
        "You write a concrete first open-source contribution plan for one student and one repo.",
        "Return ONLY JSON with keys: title, issueUrl, whyThisIssue, steps, skills, timeEstimate.",
        "issueUrl MUST be copied exactly from allowedIssueUrls, or \"\" if that array is empty. Never invent a URL.",
        "whyThisIssue MUST name the concrete gap (missing docs, wrong example, bug in a file) and why it fits this student.",
        "steps MUST be 6 to 8 items. Quote the issue title or a phrase from the issue body. Name the file, docs page, or UI where the gap appears.",
        "Include a step with the suggested PR title and what the PR body should say (problem, change, issue link).",
        "Do not write steps that only say to clone the repo or only say to read README/CONTRIBUTING.",
        "skills MUST be a non-empty array. timeEstimate MUST be a string such as \"2-4 hours\".",
      ].join(" "),
      JSON.stringify({
        kind,
        allowedIssueUrls: allowedUrls,
        issues: issues.map((issue) => ({
          title: issue.title,
          html_url: issue.html_url,
          labels: issue.labels,
          body: issue.body,
          number: issue.number,
        })),
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

    const grok = isRecord(grokResult) ? grokResult : {};
    const chosenUrl =
      pickAllowedIssueUrl(
        typeof grok.issueUrl === "string" ? grok.issueUrl.trim() : undefined,
        issues,
      ) ?? issues[0]?.html_url;
    const chosenIssue = issues.find((issue) => issue.html_url === chosenUrl);
    const title =
      typeof grok.title === "string" && grok.title.trim().length > 0
        ? grok.title.trim()
        : chosenIssue
          ? `Work on #${chosenIssue.number}: ${chosenIssue.title}`
          : `First contribution in ${repo.fullName}`;

    const whyThisIssue =
      typeof grok.whyThisIssue === "string" &&
      grok.whyThisIssue.trim().length > 0
        ? grok.whyThisIssue.trim()
        : chosenIssue
          ? `Issue #${chosenIssue.number} (${chosenIssue.title}) is a scoped gap${
              chosenIssue.body ? `: ${chosenIssue.body.slice(0, 180)}` : ""
            }.`
          : undefined;

    await ctx.runMutation(internal.ai.store.applyContributionPlan, {
      contributionId,
      title,
      issueUrl: chosenUrl,
      whyThisIssue,
      steps: enforceSteps(
        asStringArray(grok.steps),
        repo.fullName,
        chosenIssue ?? issues[0],
      ),
      skills: enforceSkills(asStringArray(grok.skills), [
        ...profile.languages,
        ...profile.stack,
      ]),
      timeEstimate:
        typeof grok.timeEstimate === "string" &&
        grok.timeEstimate.trim().length > 0
          ? grok.timeEstimate.trim()
          : "2-4 hours",
      kind,
    });

    return contributionId;
  },
});
