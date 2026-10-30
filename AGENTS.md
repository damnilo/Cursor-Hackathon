<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Node 22 and npm. Install with `npm ci --include=dev --no-audit --no-fund` (same devDependency flag as `render.yaml`).
- The dev backend is a local anonymous Convex process, not Convex Cloud. Run `CONVEX_AGENT_MODE=anonymous npx convex dev` and leave it running (port 3210). It writes `.env.local`. Do not run `npx convex deploy`.
- `npm run dev` serves Next.js on port 3000. Checks: `npm run typecheck` and `npm run lint`.
- `npx convex run repositories:seedCatalog` loads the curated catalog. `/fixtures` runs the matcher with no API keys. Google sign-in, CV parsing, and contribution plans need Convex env vars (`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`, `XAI_API_KEY`; optionally `FIRECRAWL_API_KEY`, `EXA_API_KEY`, `GITHUB_TOKEN`).
- Saving a guest profile stores `rerank: []`, and `profiles.getBySession` then fails return validation because `profileDoc` omits `rerank`. A fresh browser can open `/profile`; after save, `/matches` errors until that validator includes the field. `/fixtures` is unaffected.
