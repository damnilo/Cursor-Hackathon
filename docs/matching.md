# Matching

There is exactly one ranker: `api.matching.matchRepos` (`convex/matching.ts`), using `convex/lib/scoring.ts`. The UI, the fixtures page and `ai.rank.rankMatches` all go through it.

## Input

A profile: `languages`, `stack`, `topics`, `level` (`beginner` | `intermediate`), `wantGoodFirstIssue`. Either passed in directly (fixtures) or loaded from the stored profile for the session. A profile with no languages returns no matches.

Candidates: up to 100 rows from `repositories` (the curated catalog has 58).

## Hard filters (`passesHardFilters`)

- At least one profile language appears in the repo's `languages` or `primaryLanguage` (case-insensitive).
- If `wantGoodFirstIssue`: the live `goodFirstIssueCount` must be > 0; if no count has been fetched yet, the catalog flag `hasGoodFirstIssues` must be true.

## Score (`scoreRepository`, clamped to 0–100)

| Factor | Points |
|---|---|
| Language | 40 if the repo's primary language is known, otherwise 26 (65 %) when another language matches |
| Stack overlap | 25 × 0.7 for one hit, 25 for two or more |
| Topic overlap | 20 × 0.7 for one hit, 20 for two or more |
| Same difficulty | +5 |
| Beginner profile, intermediate repo | −15 |
| Good first issues (only if wanted) | + min(10, open count) |
| Stars | min(10, round(2 × log10(max(stars, 10)))) |

Overlap is never divided by how many chips the user picked, so selecting more chips does not dilute a score.

## Ordering

`compareByLevelThenScore`: repos whose difficulty equals the profile level come first, then higher score, then more stars. The query returns the top 5 by default (max 15).

## Reasons

Each contributing factor adds a sentence ("Uses React from your stack.", "Has 3 open good first issues."). If none apply: "Passed the filters, but the overlap with your profile is thin."

## AI rerank (present, not active)

`convex/lib/rerank.ts` can put a saved AI order first and prefix its sentence with `AI:`; the order is stored on `studentProfiles.rerank`. In the current code nothing writes that field (`ai.store.saveRerank` has no caller) and `ai.rank.rankMatches` just returns the deterministic top 5. The `aiUsage` hourly quota (10 calls per profile and kind, `convex/lib/aiQuota.ts`) is likewise defined but not called.

## CV prefill

`ai.parseCv.parseCv` extracts PDF text with `unpdf` and matches it against the chip catalog plus a short synonym list (`convex/ai/lib/catalog.ts`). It returns chips only; it does not save the profile or match.
