# AI track (colleague)

Grok / Firecrawl live in this folder. Do not edit `convex/matching.ts` or scoring weights.

## Actions

- `api.ai.normalize.normalizeProfile({ sessionId })` — Grok maps chips onto the UI catalog, then upserts the session profile. Falls back to the stored profile if Grok is down.
- `api.ai.rank.rankMatches({ sessionId, limit? })` — **always** starts from `api.matching.matchRepos` with `limit: 15`, then Grok reorders to top 3–5. Falls back to deterministic order.
- `api.ai.enrich.enrichRepo({ repositoryId })` — Firecrawl README + CONTRIBUTING, cached in `repoDocuments`.
- `api.ai.contribute.generateContribution({ sessionId, repositoryId, kind? })` — ensure row via Lazar's mutation, then Grok fills `title` / `steps` / `issueUrl`.

## Env (Convex dashboard)

- `XAI_API_KEY`
- `FIRECRAWL_API_KEY`
