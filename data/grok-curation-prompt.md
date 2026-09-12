# Grok curation prompt (Phase 1)

Use this prompt in Grok to expand the candidate pool beyond the initial 45 verified repos.

## Prompt

```
Generate a JSON array of 65 open source GitHub repositories suitable for university students making their FIRST contribution.

Requirements for each repo:
- Active (commits in last 6 months)
- Has CONTRIBUTING.md or equivalent contributor guide
- Has open issues labeled "good first issue", "help wanted", or similar
- Mix of languages: JavaScript/TypeScript, Python, Go, Rust, Java, Ruby, PHP
- Mix of difficulty: beginner, intermediate
- Mix of stars: 500 to 50,000 (avoid only mega-projects)
- Not archived, not enterprise-only

Return ONLY valid JSON array. Each object:
{
  "owner": "string",
  "name": "string",
  "url": "https://github.com/owner/name",
  "languages": ["string"],
  "topics": ["string"],
  "stars": number,
  "hasContributingGuide": true,
  "hasGoodFirstIssues": true,
  "difficulty": "beginner" | "intermediate",
  "timeCommitment": "low" | "medium" | "high",
  "description": "one sentence"
}
```

## Manual verification checklist

Before adding to `verified-repos.json`:

- [ ] Repo exists and is not archived
- [ ] CONTRIBUTING.md present
- [ ] At least 3 open "good first issue" issues
- [ ] Last commit within 6 months
- [ ] Suitable for students (clear onboarding, not toxic maintenance)
