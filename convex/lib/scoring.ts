export type Difficulty = "beginner" | "intermediate";

export type MatchProfile = {
  languages: string[];
  stack: string[];
  topics: string[];
  level: Difficulty;
  wantGoodFirstIssue: boolean;
};

export type ScorableRepo = {
  languages: string[];
  stack: string[];
  topics: string[];
  difficulty: Difficulty;
  hasGoodFirstIssues: boolean;
  primaryLanguage: string;
};

const WEIGHTS = {
  language: 40,
  stack: 25,
  topics: 20,
  goodFirstIssue: 10,
  difficulty: 5,
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function overlap(student: string[], repo: string[]): string[] {
  const repoSet = new Set(repo.map(normalize));
  const seen = new Set<string>();
  const hits: string[] = [];
  for (const item of student) {
    const key = normalize(item);
    if (key && repoSet.has(key) && !seen.has(key)) {
      seen.add(key);
      hits.push(item);
    }
  }
  return hits;
}

function ratio(hits: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return hits / total;
}

export function passesHardFilters(
  profile: MatchProfile,
  repo: ScorableRepo,
): boolean {
  if (profile.languages.length > 0) {
    const languageHits = overlap(profile.languages, [
      ...repo.languages,
      repo.primaryLanguage,
    ]);
    if (languageHits.length === 0) {
      return false;
    }
  }

  if (profile.wantGoodFirstIssue && !repo.hasGoodFirstIssues) {
    return false;
  }

  if (profile.level === "beginner" && repo.difficulty !== "beginner") {
    return false;
  }

  return true;
}

export function scoreRepository(
  profile: MatchProfile,
  repo: ScorableRepo,
): { score: number; reasons: string[] } {
  const languageHits = overlap(profile.languages, [
    ...repo.languages,
    repo.primaryLanguage,
  ]);
  const stackHits = overlap(profile.stack, repo.stack);
  const topicHits = overlap(profile.topics, repo.topics);

  const languageScore = WEIGHTS.language * ratio(languageHits.length, profile.languages.length);
  const stackScore = WEIGHTS.stack * ratio(stackHits.length, profile.stack.length);
  const topicScore = WEIGHTS.topics * ratio(topicHits.length, profile.topics.length);
  const gfiScore =
    profile.wantGoodFirstIssue && repo.hasGoodFirstIssues
      ? WEIGHTS.goodFirstIssue
      : 0;
  const difficultyScore =
    profile.level === repo.difficulty ? WEIGHTS.difficulty : 0;

  const score = Math.round(
    languageScore + stackScore + topicScore + gfiScore + difficultyScore,
  );

  const reasons: string[] = [];
  if (languageHits.length > 0) {
    reasons.push(`Languages: ${languageHits.join(", ")}`);
  }
  if (stackHits.length > 0) {
    reasons.push(`Stack: ${stackHits.join(", ")}`);
  }
  if (topicHits.length > 0) {
    reasons.push(`Topics: ${topicHits.join(", ")}`);
  }
  if (gfiScore > 0) {
    reasons.push("Has good first issues");
  }
  if (difficultyScore > 0) {
    reasons.push(`Difficulty matches ${profile.level}`);
  }
  if (reasons.length === 0) {
    reasons.push("Passed filters with a weak overlap");
  }

  return { score, reasons };
}
