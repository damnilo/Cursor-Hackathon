export const AI_WINDOW_MS = 60 * 60 * 1000;
export const AI_HOURLY_LIMIT = 10;

export const RERANK_LIMIT_MESSAGE =
  "Hourly refresh limit reached. Showing the last list.";
export const PLAN_LIMIT_MESSAGE =
  "Hourly plan limit reached. Showing the saved plan.";
export const PARSE_LIMIT_MESSAGE =
  "Hourly CV parse limit reached. Pick chips manually.";
export const GROK_MISSED_MESSAGE =
  "The model did not answer. Showing the last list.";
export const PLAN_MISSED_MESSAGE =
  "The model did not answer. Open the repository on GitHub, or try again.";

export type QuotaState = {
  count: number;
  windowStartedAt: number;
};

/** The 11th call in the same hour is refused and does not move the counter. */
export function nextQuota(
  state: QuotaState | null,
  now: number,
  limit = AI_HOURLY_LIMIT,
  windowMs = AI_WINDOW_MS,
): { allowed: boolean; next: QuotaState } {
  if (!state || now - state.windowStartedAt >= windowMs) {
    return { allowed: true, next: { count: 1, windowStartedAt: now } };
  }
  if (state.count >= limit) {
    return { allowed: false, next: state };
  }
  return {
    allowed: true,
    next: { count: state.count + 1, windowStartedAt: state.windowStartedAt },
  };
}
