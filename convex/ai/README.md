# AI track (colleague)

Fill these action bodies with Grok / Firecrawl / Exa. Do not edit
`convex/matching.ts` or scoring weights.

- `normalize.normalizeProfile` — optional profile cleanup
- `rank.rankMatches` — must start from `api.matching.matchRepos` (limit 15), return top 3–5
- `enrich.enrichRepo` — README / CONTRIBUTING scrape
- `contribute.generateContribution` — write `title` / `steps` / `issueUrl` on `contributions`

Stubs currently pass through deterministic matching so the UI is not blocked.
