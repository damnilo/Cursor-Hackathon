# AI track (colleague)

Grok / Firecrawl live in this folder. Do not edit `convex/matching.ts` or scoring weights.

## Actions

- `api.ai.normalize.normalizeProfile({ sessionId })` — Grok maps chips onto the UI catalog, then upserts the session profile. Falls back to the stored profile if Grok is down.
- `api.ai.rank.rankMatches({ sessionId, limit? })` — **always** starts from `api.matching.matchRepos` with `limit: 15`, then Grok reorders to top 3–5. Falls back to deterministic order.
- `api.ai.enrich.enrichRepo({ repositoryId })` — Firecrawl README + CONTRIBUTING, cached in `repoDocuments`.
- `api.ai.contribute.generateContribution({ sessionId, repositoryId, kind? })` — GitHub beginner issues (3–5) go into Grok; `issueUrl` is copied from that list or left empty. Steps are 6–8 concrete file/command/issue steps.

## Env (Convex dashboard)

- `XAI_API_KEY`
- `FIRECRAWL_API_KEY`
- `GITHUB_TOKEN` (optional; unauthenticated GitHub works with a low rate limit)
- `EXA_API_KEY` (backup only: find CONTRIBUTING for the **selected** repo if Firecrawl discovery misses it)
