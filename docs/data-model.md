# Data model

Defined in `convex/schema.ts`. Field validators for repositories live in `convex/lib/validators.ts`.

| Table | Purpose | Key indexes |
|---|---|---|
| Convex Auth tables (`authTables`) | Users, accounts, sessions for Google sign-in | managed by `@convex-dev/auth` |
| `repositories` | Curated catalog (58 repos from `convex/data/verified-repos.json`): owner/name, languages, stack, topics, difficulty, newcomer note, stars, `hasGoodFirstIssues`, plus `goodFirstIssueCount` / `issuesCheckedAt` from the cron | `by_fullName`, `by_difficulty`, `by_primaryLanguage`, `by_good_first` |
| `catalogMeta` | Singleton stamp (`version`, `curatedAt`) so page-load seeding skips rewriting an unchanged catalog | `by_key` |
| `studentProfiles` | One profile per guest session or Google account: chips, level, `wantGoodFirstIssue`, optional CV (`cvStorageId`, `cvFileName`), `visitId`, optional saved `rerank` (≤ 15). Sample personas are rows with `slug`, `label`, `isFixture` | `by_slug`, `by_sessionId`, `by_tokenIdentifier` |
| `contributions` | A first or next plan for a profile and repo: title, `issueUrl`, `whyThisIssue`, `steps`, `skills`, `timeEstimate`, `status` (`suggested` / `completed`), `profileUpdatedAt` used for freshness | `by_profile_repo_and_kind` and others |
| `repoDocuments` | Cached README / CONTRIBUTING markdown per repo (`source`: `firecrawl` or `none`, `note`, `fetchedAt`) | `by_repository` |
| `aiUsage` | Hourly counters per profile and AI kind (`rerank`, `plan`, `parse`, `normalize`); defined but not currently written | `by_profile_and_kind` |

## Guest vs Google profiles

- **Guest:** `sessionId` set, `tokenIdentifier` empty. The id lives in the browser's `sessionStorage`, so it is per tab/session.
- **Google:** `tokenIdentifier` set from the Convex Auth identity; lookups prefer it over `sessionId`.
- On sign-in a guest row can be merged into the account row and its contributions moved over (`convex/profiles.ts`).

Convex 1.45 has no unique indexes, so writers collapse duplicates and keep the oldest row (comments in the schema).

CV PDFs are stored in Convex file storage; replacing a CV deletes the previous file.
