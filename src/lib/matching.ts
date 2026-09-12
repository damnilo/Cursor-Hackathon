export type Difficulty = "beginner" | "intermediate";

/** Official matcher: `api.matching.matchRepos`. Frozen shared contract. */
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
  repositoryId: string;
  score: number;
  reasons: string[];
};

/**
 * Official API (do not call `api.repositories.matchRepos` from UI):
 * - `useMutation(api.seed.seedRepositories)` once on first load
 * - `useQuery(api.matching.matchRepos, { sessionId, limit: 5 })`
 * - Phase 3: `useAction(api.ai.rank.rankMatches)` reranks the same candidates
 */
