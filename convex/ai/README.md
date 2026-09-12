# AI track (colleague)

Grok / Firecrawl live in this folder. Do not edit `convex/matching.ts` or scoring weights.

## Actions

- `api.ai.normalize.normalizeProfile({ sessionId })` — Grok maps chips onto the UI catalog, then upserts the session profile. Falls back to the stored profile if Grok is down.
- `api.ai.rank.rankMatches({ sessionId, limit? })` — **always** starts from `api.matching.matchRepos` with `limit: 15`, then Grok reorders to top 3–5. Falls back to deterministic order.
- `api.ai.enrich.enrichRepo({ repositoryId })` — Firecrawl README + CONTRIBUTING, cached in `repoDocuments`.
- `api.ai.contribute.generateContribution({ sessionId, repositoryId, kind? })` — `kind: "first"` vs `"next"` use different prompts and issue picks. `issueUrl` is copied from the GitHub beginner-issue list or left empty.

## Env (Convex dashboard)

- `XAI_API_KEY`
- `FIRECRAWL_API_KEY`
- `GITHUB_TOKEN` (optional). We list issues by label first, then Search. On 401/403 the request is retried without the token (fine-grained `github_pat_` tokens sometimes cannot use Search). Empty issue lists are usually missing labels on the repo, not a bad token. Classic `ghp_` is smoother. Needs **Issues: Read** on public repos.
- `EXA_API_KEY` (backup only: find CONTRIBUTING for the **selected** repo if Firecrawl discovery misses it)
