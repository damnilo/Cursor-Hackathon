# Grok curation prompt (Phase 1)

Use this prompt in Grok to expand the candidate pool beyond the initial verified repos.

## Prompt

```
Generate a JSON array of 65 open source GitHub repositories suitable for university students making their FIRST contribution.

Requirements for each repo:
- Active (commits in last 12 months)
- English README
- Has CONTRIBUTING.md or a clear "how to contribute" section, OR labeled beginner issues
- Mix of languages: JavaScript/TypeScript, Python, Go, Rust, Java, Ruby, PHP
- Mix of difficulty: beginner, intermediate
- Mix of stars: include mid-size repos (not only mega-projects)
- Not archived, not enterprise-only

Return ONLY a valid JSON array. Each object:
{
  "owner": "string",
  "name": "string",
  "fullName": "owner/name",
  "url": "https://github.com/owner/name",
  "description": "one sentence",
  "primaryLanguage": "string",
  "languages": ["string"],
  "topics": ["string"],
  "stack": ["string"],
  "hasGoodFirstIssues": true,
  "hasContributingGuide": true,
  "difficulty": "beginner" | "intermediate",
  "newcomerNote": "one sentence on why a first-time student can contribute",
  "stars": 0,
  "verified": true
}
```

## Manual verification checklist

Before adding to `verified-repos.json`:

- [ ] Repo exists and is not archived
- [ ] Recent commits (about last 12 months)
- [ ] README in English; CONTRIBUTING or beginner-labeled issues
- [ ] License present
- [ ] Fill `languages`, `topics`, `stack`, `hasGoodFirstIssues`, `newcomerNote`, `difficulty`
