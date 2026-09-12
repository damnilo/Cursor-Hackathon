# FirstContrib

Help students find their first open source contribution through deterministic matching and AI-guided onboarding.

## Phase 1 — Foundation (current)

- Next.js (App Router) landing, stub `/profile` and `/matches`, Convex health check
- 46 curated beginner-friendly repositories in `data/verified-repos.json`
- Shared match types in `src/lib/matching.ts`
- Render blueprint in `render.yaml`
- Ready for Phase 2: Convex `repositories` seed + deterministic `matchRepos` (profiles stay in the client — no auth)

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Convex

```bash
npx convex login
npx convex dev
```

This creates `.env.local` with `NEXT_PUBLIC_CONVEX_URL`. Keep `npx convex dev` running while you develop. Do **not** run `npx convex deploy` until you intentionally ship a production Convex deployment.

Copy `.env.example` if you need a blank template. Put raw keys in `keys.txt` (gitignored) and copy them into `.env.local` / Convex env / Render — never commit them.

### 3. Run the app

In a second terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see **Backend connected** when Convex is running.

## Environment variables

| Variable | Where | Phase | Purpose |
|----------|--------|-------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Next.js / Render (needed at **build** time) | 1 | Convex client URL |
| `XAI_API_KEY` | Convex dashboard | 3 | Grok ranking & contribution plans |
| `FIRECRAWL_API_KEY` | Convex dashboard | 3 | README / CONTRIBUTING scrape |

No GitHub token for Phase 1–2: matching uses the curated JSON, not the live GitHub API.

## Deploy to Render

Convex stays on Convex Cloud. Render only hosts Next.js.

1. Push to GitHub
2. New Web Service from [`render.yaml`](render.yaml) (or equivalent dashboard settings)
3. Set `NEXT_PUBLIC_CONVEX_URL` **before the first build** (Next inlines `NEXT_PUBLIC_*` at build time). A Convex **dev** URL is fine for today's demo.
4. Build: `npm install && npm run build`
5. Start: `npm start`

Production Convex (`npx convex deploy`) only after matching works and you want a stable demo URL.

## Project structure

```
data/verified-repos.json   # Curated repos for Phase 2 seed
data/grok-curation-prompt.md
convex/                    # Backend (health ping in Phase 1)
src/app/                   # Next.js App Router
src/app/profile/           # Stub — form in Phase 2
src/app/matches/           # Stub — cards in Phase 2
src/lib/matching.ts        # Shared profile + repo types
src/components/landing/    # Landing page UI
```

## Team split

- **UI track:** profile chips, match cards, contribution views
- **Backend track:** Convex schema, seed import, deterministic filter/score, Grok actions
