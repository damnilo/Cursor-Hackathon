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

export const matchResultValidator = v.object({
  repositoryId: v.id("repositories"),
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
  score: v.number(),
  reasons: v.array(v.string()),
});
