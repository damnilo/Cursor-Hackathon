/**
 * True when a saved plan still matches the chip save and an open issue.
 * profileUpdatedAt moves on upsert, not when a CV file is stored.
 * The same rule covers the first plan and the next plan.
 */
export function firstPlanIsFresh(args: {
  force?: boolean;
  stepCount: number;
  profileUpdatedAt: number | undefined;
  planProfileUpdatedAt: number | undefined;
  savedIssueUrl: string | undefined;
  openIssueUrls: readonly string[];
}): boolean {
  if (args.force) {
    return false;
  }
  if (args.stepCount <= 0) {
    return false;
  }
  const saved = args.savedIssueUrl?.trim();
  if (typeof args.planProfileUpdatedAt !== "number") {
    // GitHub did not answer, so keep the saved plan and try again later.
    return Boolean(saved) && args.openIssueUrls.length === 0;
  }
  if (
    typeof args.profileUpdatedAt === "number" &&
    args.profileUpdatedAt > args.planProfileUpdatedAt
  ) {
    return false;
  }
  if (
    saved &&
    args.openIssueUrls.length > 0 &&
    !args.openIssueUrls.includes(saved)
  ) {
    return false;
  }
  return true;
}
