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
  pickIssueForKind,
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
    /^(fork|clone|git clone)\b/i.test(text) ||
    /only say to clone/i.test(text) ||
    /read( the)? (repo )?(guide|readme|contributing)(\.|$)/i.test(text) ||
    /open .+ README\.md and CONTRIBUTING/i.test(text) ||
    /pick a docs or comment typo/i.test(text)
  );
}

function concreteFallbackSteps(
  kind: Kind,
  repoFullName: string,
  issue: GithubIssue | undefined,
  previousTitle: string | undefined,
): string[] {
  const repoName = repoFullName.split("/")[1] ?? repoFullName;
  if (issue && kind === "next") {
    return [
      `This is the NEXT task after "${previousTitle ?? "the first PR"}": do not repeat that first patch.`,
      `Issue #${issue.number} (${issue.title}): add tests or a second file named in ${issue.html_url}.`,
      `Write a failing test (or docs assertion) that would have caught the gap in #${issue.number}, in the test/ or docs/ path used by this repo.`,
      `Run the test or lint command from package.json / CONTRIBUTING.md and paste the command + result in the PR body.`,
      `PR title: "Follow-up #${issue.number}: tests for ${issue.title.slice(0, 50)}".`,
      `PR body must include: what the first change missed, the command you ran, and ${issue.html_url}.`,
      `If #${issue.number} is already patched, take the next beginner issue in the allowed list instead of rewriting the first PR.`,
      `Comment on ${issue.html_url} with the new PR URL and which files you touched this time.`,
    ];
  }
  if (issue) {
    const gap =
      issue.body.length > 0 ? issue.body.slice(0, 220) : issue.title;
    return [
      `Issue #${issue.number} (${issue.title}): ${gap}`,
      `Open ${issue.html_url} and list the files, docs page, or UI named in the description.`,
      `Change only those files so #${issue.number} is addressed — quote the wrong or missing text in the PR.`,
      `PR title: "Fix #${issue.number}: ${issue.title.slice(0, 70)}".`,
      `PR body: problem, the file you edited, and ${issue.html_url}.`,
      `Run the lint or test command from CONTRIBUTING.md or package.json, then open the PR that links #${issue.number}.`,
    ];
  }
  return [
    `Use ${repoFullName} newcomer docs to pick a labeled docs/example gap — do not invent a GitHub issue URL.`,
    `Edit a real path such as README.md, docs/, or an example file in ${repoName}; describe the exact string you change.`,
    `Run the lint or markdown command from CONTRIBUTING.md or package.json scripts.`,
    `PR title names the file, e.g. "docs: fix stale command in README.md".`,
    `PR body quotes the before/after snippet and the CONTRIBUTING section you followed.`,
    `Do not spend a step only cloning the repo or only reading the README.`,
  ];
}

function enforceSteps(
  kind: Kind,
  raw: string[],
  repoFullName: string,
  issue: GithubIssue | undefined,
  previousTitle: string | undefined,
): string[] {
  const cleaned = raw
    .map((step) => step.trim())
    .filter((step) => step.length > 0 && !isVagueStep(step));
  const fallback = concreteFallbackSteps(
    kind,
    repoFullName,
    issue,
    previousTitle,
  );
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

function grokSystemPrompt(kind: Kind, hasOtherIssue: boolean): string {
  if (kind === "next") {
    return [
      "You write the NEXT open-source contribution plan. It must NOT copy the first plan.",
      "Return ONLY JSON with keys: title, issueUrl, whyThisIssue, steps, skills, timeEstimate.",
      hasOtherIssue
        ? "issueUrl MUST be a different URL from previousIssueUrl, copied exactly from allowedIssueUrls."
        : "If only one allowed URL exists, reuse it but the work must be a follow-up (tests, PR body, a second file) — not the same patch.",
      "title MUST start with Next: and must differ from previousTitle.",
      "whyThisIssue explains what the first plan did not cover.",
      "steps MUST be 6 to 8 items: tests, lint command, PR body, or another file. Name issue numbers and paths.",
      "Do not write a first-contribution intro. Do not spend steps only cloning or only reading README.",
      "skills MUST be a non-empty array. timeEstimate MUST be a string such as \"2-4 hours\".",
    ].join(" ");
  }
  return [
    "You write a concrete FIRST open-source contribution plan for one student and one repo.",
    "Return ONLY JSON with keys: title, issueUrl, whyThisIssue, steps, skills, timeEstimate.",
    "issueUrl MUST be copied exactly from allowedIssueUrls, or \"\" if that array is empty. Never invent a URL.",
    "whyThisIssue MUST name the concrete gap (missing docs, wrong example, bug in a file) and why it fits this student.",
    "steps MUST be 6 to 8 items. Quote the issue title or a phrase from the issue body. Name the file, docs page, or UI where the gap appears.",
    "Include a step with the suggested PR title and what the PR body should say (problem, change, issue link).",
    "Do not write steps that only say to clone the repo or only say to read README/CONTRIBUTING.",
    "skills MUST be a non-empty array. timeEstimate MUST be a string such as \"2-4 hours\".",
  ].join(" ");
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

    const previous = await ctx.runQuery(api.contributions.getForRepo, {
      sessionId: args.sessionId,
      repositoryId: args.repositoryId,
    });

    const [docs, issues] = await Promise.all([
      loadRepoDocs(ctx, args.repositoryId),
      fetchBeginnerIssues(repo.owner, repo.name),
    ]);
    const allowedUrls = issues.map((issue) => issue.html_url);
    const previousUrl = previous?.issueUrl;
    const hasOtherIssue = issues.some(
      (issue) => issue.html_url !== previousUrl,
    );

    const grokResult = await grokJson(
      grokSystemPrompt(kind, hasOtherIssue),
      JSON.stringify({
        kind,
        previousPlan:
          kind === "next"
            ? {
                title: previous?.title ?? null,
                issueUrl: previousUrl ?? null,
                steps: previous?.steps ?? [],
                whyThisIssue: previous?.whyThisIssue ?? null,
              }
            : null,
        previousIssueUrl: previousUrl ?? null,
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
    const grokUrl =
      typeof grok.issueUrl === "string" ? grok.issueUrl.trim() : undefined;
    const chosenIssue = pickIssueForKind(
      kind,
      issues,
      grokUrl,
      previousUrl,
    );
    const chosenUrl = chosenIssue?.html_url;

    const titleFromGrok =
      typeof grok.title === "string" && grok.title.trim().length > 0
        ? grok.title.trim()
        : undefined;
    const title =
      kind === "next"
        ? titleFromGrok &&
          !/first contribution/i.test(titleFromGrok) &&
          titleFromGrok !== previous?.title
          ? titleFromGrok.startsWith("Next:")
            ? titleFromGrok
            : `Next: ${titleFromGrok}`
          : chosenIssue
            ? `Next: follow-up on #${chosenIssue.number} (${chosenIssue.title})`
            : `Next: tests and PR write-up for ${repo.fullName}`
        : titleFromGrok
          ? titleFromGrok
          : chosenIssue
            ? `Work on #${chosenIssue.number}: ${chosenIssue.title}`
            : `Docs fix in ${repo.fullName}`;

    const whyThisIssue =
      typeof grok.whyThisIssue === "string" &&
      grok.whyThisIssue.trim().length > 0
        ? grok.whyThisIssue.trim()
        : chosenIssue
          ? kind === "next"
            ? `Follow-up on #${chosenIssue.number} (${chosenIssue.title}): tests, PR body, or a second file — not the first patch.`
            : `Issue #${chosenIssue.number} (${chosenIssue.title}) is a scoped gap${
                chosenIssue.body ? `: ${chosenIssue.body.slice(0, 180)}` : ""
              }.`
          : undefined;

    await ctx.runMutation(internal.ai.store.applyContributionPlan, {
      contributionId,
      title,
      issueUrl: chosenUrl,
      whyThisIssue,
      steps: enforceSteps(
        kind,
        asStringArray(grok.steps),
        repo.fullName,
        chosenIssue,
        previous?.title,
      ),
      skills: enforceSkills(asStringArray(grok.skills), [
        ...profile.languages,
        ...profile.stack,
      ]),
      timeEstimate:
        typeof grok.timeEstimate === "string" &&
        grok.timeEstimate.trim().length > 0
          ? grok.timeEstimate.trim()
          : kind === "next"
            ? "2-3 hours"
            : "2-4 hours",
      kind,
    });

    return contributionId;
  },
});
