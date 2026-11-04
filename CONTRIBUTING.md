# Contributing

FirstContrib is a hackathon prototype, but fixes and improvements are welcome.

## Setup

```bash
npm install
cp .env.example .env.local
npx convex login
npx convex dev      # your own dev deployment; never point it at the production project
npm run dev
```

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm run build
```

CI runs the same three checks on every push and pull request.

## Where things live

- **Catalog:** edit `data/verified-repos.json` and `convex/data/verified-repos.json` (seed source); bump its `version` or `curatedAt` so page-load seeding picks up the change.
- **Matching:** `convex/matching.ts` and `convex/lib/scoring.ts` are the only ranker. Do not add a second one. Check ranking changes on `/fixtures`, which runs sample personas through the same matcher.
- **Plans and external APIs:** `convex/ai/`.

## Manual checks

- Guest flow: save a profile, open `/matches`, open a plan.
- Google flow: needs `SITE_URL`, `AUTH_GOOGLE_*`, `JWT_PRIVATE_KEY` and `JWKS` on your Convex dev deployment.
- Fallbacks: unset `FIRECRAWL_API_KEY` / `GITHUB_TOKEN` and confirm plans still render with template steps.

## Pull requests

Branch from `main`, keep PRs focused, describe what changed and how you tested it. Never commit `.env.local`, `keys.txt` or real API keys.
