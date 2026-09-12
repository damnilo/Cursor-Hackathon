export type Difficulty = "beginner" | "intermediate";

/** Passed to `api.repositories.matchRepos` (no auth — not stored). */
export type StudentProfile = {
  languages: string[];
  stack: string[];
  topics: string[];
  level: Difficulty;
  wantGoodFirstIssue: boolean;
};

export type VerifiedRepository = {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  primaryLanguage: string;
  languages: string[];
  topics: string[];
  stack: string[];
  hasGoodFirstIssues: boolean;
  hasContributingGuide: boolean;
  difficulty: Difficulty;
  newcomerNote: string;
  stars: number;
  verified: true;
};

export type MatchResult = VerifiedRepository & {
  score: number;
  reasons: string[];
};

/**
 * UI track (Phase 2):
 * - `useMutation(api.repositories.seedCatalog)` once on first load if facets.repositoryCount === 0
 * - `useQuery(api.repositories.getFacets)` for chip lists
 * - `useQuery(api.repositories.listSampleProfiles)` for demo "Load sample profile"
 * - `useQuery(api.repositories.matchRepos, profile)` for top 5 cards
 */
