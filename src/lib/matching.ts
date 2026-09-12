export type Difficulty = "beginner" | "intermediate";

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
