# FirstContrib

Students pick languages and interests (or upload a CV), get 3–5 beginner-friendly GitHub repos from a curated catalog, then an AI-guided first or next contribution plan.

Guest mode works without an account. Google sign-in is optional and keeps the same profile, CV, and plans across browsers.

## Tech stack

### App

| Technology | Role |
|---|---|
| [Next.js](https://nextjs.org) 16 (App Router, Turbopack) | Frontend and local/prod web server |
| [React](https://react.dev) 19 | UI |
| [TypeScript](https://www.typescriptlang.org) 5 | App + Convex backend |
| [Tailwind CSS](https://tailwindcss.com) 4 + PostCSS | Styling |
| Geist / Geist Mono (`next/font`) | Typography |
| ESLint 9 + `eslint-config-next` + `@convex-dev/eslint-plugin` | Lint |

### Backend and data

| Technology | Role |
|---|---|
| [Convex](https://convex.dev) 1.45 | Database, queries, mutations, actions, file storage, realtime |
| [Convex Auth](https://labs.convex.dev/auth) + [Auth.js](https://authjs.dev) (`@auth/core`) | Session / JWT auth |
| Google OAuth | Optional sign-in |
| `jose` | JWT keys used by Convex Auth |
| Convex file storage + [unpdf](https://github.com/unjs/unpdf) | CV PDF upload and text extract |

### AI and external APIs

| Technology | Role |
|---|---|
| [xAI Grok](https://x.ai) (`grok-3-mini`) | Match rerank, first/next contribution plans, CV → catalog chips, profile normalize |
| [Firecrawl](https://www.firecrawl.dev) | README / CONTRIBUTING scrape (enrich path) |
| [Exa](https://exa.ai) | Find a CONTRIBUTING URL when scrape fallbacks miss |
| [GitHub REST API](https://docs.github.com/en/rest) | Beginner-labeled issues for a plan |

### Hosting

| Technology | Role |
|---|---|
| [Convex Cloud](https://www.convex.dev) | Backend deployment (dev + prod) |
| [Render](https://render.com) | Next.js web service (`render.yaml`, Node 22) |
| npm | Package manager |

Matching itself is deterministic TypeScript (`convex/matching.ts` + `convex/lib/scoring.ts`) over **58** curated repos. Grok only reranks that shortlist and writes contribution steps.

## Quick start

### 1. Install

```bash
npm install
```

### 2. Convex (keep this running)

```bash
npx convex login
npx convex dev
```

This writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local`. Do **not** run `npx convex deploy` unless you intend to ship production.

Copy `.env.example` if you need a blank template. Put raw keys in `keys.txt` (gitignored) and copy them into `.env.local`, the Convex dashboard, or Render — never commit them.

### 3. Next.js

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Next.js / Render (**build** time) | Convex client URL |
| `SITE_URL` | Convex dashboard | Auth callback origin (`http://localhost:3000` locally) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Convex dashboard | Google OAuth |
| `JWT_PRIVATE_KEY` / `JWKS` | Convex dashboard | Convex Auth JWT (`npx convex dev` can generate these) |
| `XAI_API_KEY` | Convex dashboard | Grok |
| `FIRECRAWL_API_KEY` | Convex dashboard | Doc scrape |
| `EXA_API_KEY` | Convex dashboard | CONTRIBUTING hunt |
| `GITHUB_TOKEN` | Convex dashboard | Higher GitHub rate limit for issue lookup |

Google redirect URI (this Convex deployment):

`https://<your-deployment>.convex.site/api/auth/callback/google`

On Render, change **`SITE_URL` only** to the public origin. Do not rotate the Google client if it still points at the same Convex deployment.

## What the app does

1. **Profile** (`/profile`) — catalog chips, optional Google sign-in, optional PDF CV (`unpdf` + Grok).
2. **Matches** (`/matches`) — deterministic `api.matching.matchRepos`. Optional Grok rerank on Refresh.
3. **Plan** (`/matches/[id]`) — GitHub beginner issues + Grok first/next steps. Cached plans are not regenerated.
4. **Fixtures** (`/fixtures`) — hard-coded personas through the same matcher (no Grok).

## Deploy to Render

Convex stays on Convex Cloud. Render only hosts Next.js.

1. Push to GitHub
2. New Web Service from [`render.yaml`](render.yaml)
3. Set `NEXT_PUBLIC_CONVEX_URL` **before the first build**
4. Build: `npm ci --include=dev && npm run build`
5. Start: `npm start`

## Project structure

```
src/app/                   Next.js App Router (landing, profile, matches, fixtures)
src/components/            UI (auth, profile, matches, landing)
src/lib/                   Shared catalogs + match types
convex/schema.ts           Tables: repositories, studentProfiles, contributions, repoDocuments + auth
convex/matching.ts         Official matcher (UI and AI must call this)
convex/profiles.ts         Guest session + Google identity merge
convex/ai/                 Grok, CV parse, rank, contribute, Firecrawl/Exa/GitHub helpers
convex/data/               58 verified repos + sample profiles
data/verified-repos.json   Same catalog (seed source of truth)
render.yaml                Render web service
```

## Scripts

```bash
npm run dev          # Next.js (Turbopack)
npx convex dev       # Convex backend watcher
npm run typecheck
npm run lint
npm run seed:catalog # Optional catalog seed via repositories:seedCatalog
```
