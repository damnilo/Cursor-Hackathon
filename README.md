# FirstContrib

Help students find their first open source contribution through deterministic matching and AI-guided onboarding.

## Phase 1 — Foundation (current)

- Next.js landing page with Convex health check
- 45 curated beginner-friendly repositories in `data/verified-repos.json`
- Ready for Phase 2: schema, student profiles, matching

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

This creates `.env.local` with `NEXT_PUBLIC_CONVEX_URL`.

### 3. Run the app

In a second terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see **Backend connected** when Convex is running.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env` or `.env.local`.

| Variable | Phase | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | 1 | Convex client URL |
| `XAI_API_KEY` | 3 | Grok ranking & contribution plans |
| `GITHUB_TOKEN` | 2+ | Repo metadata enrichment |
| `FC_API_KEY` | 3 | Firecrawl scraping |
| `EXA_API_KEY` | 3 | Exa enrichment |

## Deploy to Render

1. Push to GitHub
2. Create Convex production deployment: `npx convex deploy`
3. Render Dashboard → New Web Service → connect repo
4. Set `NEXT_PUBLIC_CONVEX_URL` to your **production** Convex URL
5. Build: `npm install && npm run build`
6. Start: `npm start`

Or use the included [`render.yaml`](render.yaml) Blueprint.

## Project structure

```
data/verified-repos.json   # Curated repos for Phase 2 seed
convex/                    # Backend (health ping in Phase 1)
src/app/                   # Next.js App Router
src/components/landing/    # Landing page UI
```

## Team split (after Phase 1)

- **UI track:** student profile form, match results, contribution guidance views
- **Backend track:** Convex schema, seed import, deterministic filter/score, Grok actions
