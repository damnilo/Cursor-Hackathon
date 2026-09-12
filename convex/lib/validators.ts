import { v } from "convex/values";

export const difficultyValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
);

export const studentProfileFields = {
  languages: v.array(v.string()),
  stack: v.array(v.string()),
  topics: v.array(v.string()),
  level: difficultyValidator,
  wantGoodFirstIssue: v.boolean(),
};

export const studentProfileValidator = v.object(studentProfileFields);

export const repositoryFields = {
  owner: v.string(),
  name: v.string(),
  fullName: v.string(),
  url: v.string(),
  description: v.string(),
  primaryLanguage: v.string(),
  languages: v.array(v.string()),
  topics: v.array(v.string()),
  stack: v.array(v.string()),
  hasGoodFirstIssues: v.boolean(),
  hasContributingGuide: v.boolean(),
  difficulty: difficultyValidator,
  newcomerNote: v.string(),
  stars: v.number(),
  verified: v.literal(true),
};

export const repositoryValidator = v.object(repositoryFields);

export const contributionKindValidator = v.union(
  v.literal("first"),
  v.literal("next"),
);

export const matchResultFields = {
  repositoryId: v.id("repositories"),
  ...repositoryFields,
  score: v.number(),
  reasons: v.array(v.string()),
};

export const matchResultValidator = v.object(matchResultFields);
