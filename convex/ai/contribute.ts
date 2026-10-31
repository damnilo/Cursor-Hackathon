"use node";

// OWNER: colleague (AI). First and next plans from the repo docs and a GitHub issue.
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { Infer, v } from "convex/values";
import { contributionKindValidator } from "../lib/validators";
import { fetchBeginnerIssues, pickIssueForKind, type GithubIssue } from "./lib/githubIssues";
import { guideStepsFromDocs } from "./lib/guide";
import { Id } from "../_generated/dataModel";
import { firstPlanIsFresh } from "../lib/planFreshness";

type Kind = Infer<typeof contributionKindValidator>;

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

function enforceSkills(raw: string[], profileSkills: string[]): string[] {
  const cleaned = raw.map((skill) => skill.trim()).filter(Boolean);
  if (cleaned.length > 0) {
    return cleaned.slice(0, 8);
  }
  const fromProfile = profileSkills.map((skill) => skill.trim()).filter(Boolean);
  return fromProfile.length > 0 ? fromProfile.slice(0, 8) : ["git", "GitHub"];
}

function planSteps(
  kind: Kind,
  repoFullName: string,
  repoUrl: string,
  issue: GithubIssue | undefined,
  previousTitle: string | undefined,
  readme: string | null | undefined,
  contributing: string | null | undefined,
): string[] {
  const fromDocs = guideStepsFromDocs(readme, contributing);
  if (fromDocs.length === 0) {
    return concreteFallbackSteps(kind, repoFullName, issue, previousTitle);
  }
  const lead = issue
    ? `Issue #${issue.number} (${issue.title}): ${
        issue.body.length > 0 ? issue.body.slice(0, 180) : issue.title
      }`
    : `Repository ${repoFullName}: follow the newcomer docs at ${repoUrl}.`;
  return [lead, ...fromDocs].slice(0, 8);
}

export const generateContribution = action({
  args: {
    sessionId: v.string(),
    repositoryId: v.id("repositories"),
    kind: v.optional(contributionKindValidator),
    force: v.optional(v.boolean()),
  },
  returns: v.union(v.id("contributions"), v.null()),
  handler: async (ctx, args): Promise<Id<"contributions"> | null> => {
    const kind: Kind = args.kind ?? "first";
    await ctx.runMutation(api.profiles.linkSession, {
      sessionId: args.sessionId,
    });
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

    const [profile, repo, previous, nextPlan, docs] = await Promise.all([
      ctx.runQuery(api.profiles.getBySession, {
        sessionId: args.sessionId,
      }),
      ctx.runQuery(internal.ai.store.getRepository, {
        repositoryId: args.repositoryId,
      }),
      ctx.runQuery(api.contributions.getForRepo, {
        sessionId: args.sessionId,
        repositoryId: args.repositoryId,
        kind: "first",
      }),
      ctx.runQuery(api.contributions.getForRepo, {
        sessionId: args.sessionId,
        repositoryId: args.repositoryId,
        kind: "next",
      }),
      ctx.runQuery(internal.ai.store.getRepoDocument, {
        repositoryId: args.repositoryId,
      }),
    ]);
    if (!profile || !repo) {
      return null;
    }

    // Do not scrape on this click. The docs cron fills repoDocuments;
    // this plan only reads that cache.
    const issues = await fetchBeginnerIssues(repo.owner, repo.name);
    const allowedUrls = issues.map((issue) => issue.html_url);
    const savedPlan = kind === "next" ? nextPlan : previous;
    if (
      firstPlanIsFresh({
        force: args.force,
        stepCount: savedPlan?.steps?.length ?? 0,
        profileUpdatedAt: profile.updatedAt,
        planProfileUpdatedAt: savedPlan?.profileUpdatedAt,
        savedIssueUrl: savedPlan?.issueUrl,
        openIssueUrls: allowedUrls,
      })
    ) {
      return contributionId;
    }

    const previousUrl = previous?.issueUrl;
    const chosenIssue = pickIssueForKind(kind, issues, undefined, previousUrl);
    const title =
      kind === "next"
        ? chosenIssue
          ? `Next: follow-up on #${chosenIssue.number} (${chosenIssue.title})`
          : `Next: tests and PR write-up for ${repo.fullName}`
        : chosenIssue
          ? `Work on #${chosenIssue.number}: ${chosenIssue.title}`
          : `Docs fix in ${repo.fullName}`;
    const whyThisIssue = chosenIssue
      ? kind === "next"
        ? `Follow-up on #${chosenIssue.number} (${chosenIssue.title}): tests, PR body, or a second file — not the first patch.`
        : `Issue #${chosenIssue.number} (${chosenIssue.title}) is a scoped gap${
            chosenIssue.body ? `: ${chosenIssue.body.slice(0, 180)}` : ""
          }.`
      : `Newcomer steps come from the README or CONTRIBUTING for ${repo.fullName}. Start at ${repo.url}.`;

    await ctx.runMutation(internal.ai.store.applyContributionPlan, {
      contributionId,
      title,
      issueUrl: chosenIssue?.html_url,
      whyThisIssue,
      steps: planSteps(
        kind,
        repo.fullName,
        repo.url,
        chosenIssue,
        previous?.title,
        docs?.readmeMarkdown,
        docs?.contributingMarkdown,
      ),
      skills: enforceSkills([], [...profile.languages, ...profile.stack]),
      timeEstimate: kind === "next" ? "2-3 hours" : "2-4 hours",
      kind,
      profileUpdatedAt: profile.updatedAt ?? Date.now(),
    });

    return contributionId;
  },
});
