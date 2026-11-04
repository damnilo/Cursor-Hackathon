# Security

## Secrets

- Never commit API keys, OAuth secrets or JWT keys. `.env*` (except `.env.example`), `keys.txt` and `.auth-keys.json` are gitignored.
- Backend secrets (`SITE_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `JWT_PRIVATE_KEY`, `JWKS`, `GITHUB_TOKEN`, `FIRECRAWL_API_KEY`, `EXA_API_KEY`, `XAI_API_KEY`) live in the Convex dashboard. The only frontend variable, `NEXT_PUBLIC_CONVEX_URL`, is public by design and set in Render.
- If a key is committed by accident, rotate it immediately; removing the commit is not enough.

## Personal data

Users can upload a CV as a PDF; it is stored in Convex file storage and may contain personal data. Do not add real CVs, test PDFs with personal data, or exported profile data to the repository or to issues.

## Reporting a vulnerability

Please do not open a public issue. Report it privately to the repository owner ([@damnilo](https://github.com/damnilo)), for example through GitHub's private vulnerability reporting if enabled, with steps to reproduce.
