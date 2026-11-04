# Architecture

FirstContrib is a Next.js frontend talking directly to a Convex backend. There is no separate API server: the browser calls Convex queries, mutations and actions through the Convex React client (`src/app/ConvexClientProvider.tsx`).

## Request flow

| Step | Frontend | Convex function |
|---|---|---|
| Seed catalog on page load | `ProfileForm`, `MatchesPageClient`, `FixturesPageClient` | `seed.seedRepositories` (skips writes when the `catalogMeta` stamp matches `convex/data/verified-repos.json`) |
| Save profile | `src/components/profile/ProfileForm.tsx` | `profiles.upsert` |
| Upload CV | `ProfileForm` | `profiles.generateUploadUrl` → upload to Convex storage → `profiles.saveCv` → `ai.parseCv.parseCv` |
| Show matches | `src/components/matches/MatchesPageClient.tsx` | `matching.matchRepos` (reactive query) |
| Refresh recommendations | `MatchesPageClient` | `ai.rank.rankMatches` (returns the deterministic top 5; no model call) |
| Open plan | `src/components/matches/MatchDetailClient.tsx` | `ai.contribute.generateContribution` (`kind: "first"`) |
| Mark done / next plan | `MatchDetailClient` | `contributions.markCompleted`, then `generateContribution` with `kind: "next"` |

## Sessions and auth

- A guest gets a random session id stored in `sessionStorage` (`firstcontrib.sessionId`) plus a per-tab `visitId` (`src/lib/session.ts`). Profiles are looked up by `sessionId`.
- Google sign-in uses Convex Auth (`convex/auth.ts`, provider `@auth/core/providers/google`). A signed-in profile is looked up by `tokenIdentifier` first.
- `profiles.linkSession` attaches the identity to the session row; a guest profile can be merged into the account profile (`mergeGuestIntoCanonical`, contributions are re-homed).
- Chips saved in one tab are only applied to queries from the same `visitId` (`convex/lib/chipFreshness.ts`).

## Plan generation (`convex/ai/contribute.ts`)

1. Ensure a `contributions` row exists (`contributions.ensureSuggested`).
2. Fetch up to 5 open issues labelled `good first issue` / `good-first-issue` (labels API first, Search API as fallback).
3. If the saved plan is still fresh (`convex/lib/planFreshness.ts`), return it unchanged.
4. Pick an issue (for `next`, a different one than the first plan), build steps from cached README/CONTRIBUTING sections (`convex/ai/lib/guide.ts`) or from a template, and save the plan (`ai.store.applyContributionPlan`).

The plan action never scrapes; it only reads `repoDocuments`.

## Background jobs (`convex/crons.ts`)

| Job | Interval | What it does |
|---|---|---|
| `refresh good first issue counts` | 1 hour | Counts open good-first issues for the 10 least recently checked repos (GitHub Search) and stores `goodFirstIssueCount` |
| `refresh repo readme cache` | 2 minutes | Scrapes README and CONTRIBUTING for one repo without a finished hunt (Firecrawl; Exa finds the CONTRIBUTING URL if links and standard paths miss) |

## External services

| Service | Client | Timeout | On failure |
|---|---|---|---|
| GitHub REST | `convex/ai/lib/githubIssues.ts` | 8 s | Empty list / `null` count; 401/403 retried without token |
| Firecrawl | `convex/ai/lib/firecrawl.ts` | 8 s | `null`; doc recorded as `source: "none"` |
| Exa | `convex/ai/lib/exa.ts` | 6 s | `null` |
| xAI Grok | `convex/ai/lib/grok.ts` | 20 s | `null` (client currently not called) |

## Deployment

- **Convex Cloud** runs functions, DB, crons and storage. Deploy with `npx convex deploy` to the same deployment that `NEXT_PUBLIC_CONVEX_URL` points to. Secrets (`SITE_URL`, `AUTH_GOOGLE_*`, `JWT_PRIVATE_KEY`, `JWKS`, API keys) live in the Convex dashboard.
- **Render** runs only the Next.js server, from `render.yaml`: Node 22, build `npm ci --include=dev --no-audit --no-fund && npm run build`, start `npm start`. `NEXT_PUBLIC_CONVEX_URL` must be set before the first build because Next inlines `NEXT_PUBLIC_*` at build time.
- After moving to a public origin, change only `SITE_URL` in Convex; the Google redirect URI points at the Convex site URL, not at Render.
