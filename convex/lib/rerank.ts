export type SavedRerank = {
  repositoryId: string;
  why?: string;
};

/** Puts the saved refresh order first and keeps its AI sentence on each repo. */
export function applySavedRerank<T extends { repositoryId: string; reasons: string[] }>(
  ranked: T[],
  rerank: readonly SavedRerank[] | undefined,
  limit: number,
): T[] {
  if (!rerank || rerank.length === 0) {
    return ranked.slice(0, limit);
  }
  const byId = new Map(ranked.map((item) => [item.repositoryId, item]));
  const seen = new Set<string>();
  const ordered: T[] = [];
  for (const entry of rerank) {
    const repo = byId.get(entry.repositoryId);
    if (!repo || seen.has(entry.repositoryId)) {
      continue;
    }
    seen.add(entry.repositoryId);
    const why = entry.why?.trim();
    ordered.push(
      why
        ? {
            ...repo,
            reasons: [
              `AI: ${why}`,
              ...repo.reasons.filter((reason) => !reason.startsWith("AI: ")),
            ],
          }
        : repo,
    );
  }
  for (const repo of ranked) {
    if (!seen.has(repo.repositoryId)) {
      ordered.push(repo);
    }
  }
  return ordered.slice(0, limit);
}
