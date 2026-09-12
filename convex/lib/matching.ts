export type Difficulty = "beginner" | "intermediate";

export type StudentProfileInput = {
  languages: string[];
  stack: string[];
  topics: string[];
  level: Difficulty;
  wantGoodFirstIssue: boolean;
};

export type ScorableRepo = {
  fullName: string;
  languages: string[];
  stack: string[];
  topics: string[];
  hasGoodFirstIssues: boolean;
  difficulty: Difficulty;
  verified: boolean;
};

export type RankedRepo<T extends ScorableRepo> = {
  repo: T;
  score: number;
  reasons: string[];
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function overlappingValues(left: string[], right: string[]): string[] {
  const rightSet = new Set(right.map(normalize).filter(Boolean));
  const seen = new Set<string>();
  const matches: string[] = [];

  for (const item of left) {
    const key = normalize(item);
    if (!key || seen.has(key) || !rightSet.has(key)) {
      continue;
    }
    seen.add(key);
    matches.push(item);
  }

  return matches;
}

export function passesFilters<T extends ScorableRepo>(
  repo: T,
  profile: StudentProfileInput,
): boolean {
  if (!repo.verified) {
    return false;
  }
  if (profile.wantGoodFirstIssue && !repo.hasGoodFirstIssues) {
    return false;
  }

  const languageHit =
    overlappingValues(profile.languages, repo.languages).length > 0;
  const stackHit = overlappingValues(profile.stack, repo.stack).length > 0;
  return languageHit || stackHit;
}

export function scoreRepo(
  repo: ScorableRepo,
  profile: StudentProfileInput,
): { score: number; reasons: string[] } {
  const languages = overlappingValues(profile.languages, repo.languages);
  const stack = overlappingValues(profile.stack, repo.stack);
  const topics = overlappingValues(profile.topics, repo.topics);

  let score = 0;
  const reasons: string[] = [];

  if (languages.length > 0) {
    score += 3 * languages.length;
    reasons.push(`Languages: ${languages.join(", ")}`);
  }
  if (stack.length > 0) {
    score += 2 * stack.length;
    reasons.push(`Stack: ${stack.join(", ")}`);
  }
  if (topics.length > 0) {
    score += 2 * topics.length;
    reasons.push(`Topics: ${topics.join(", ")}`);
  }
  if (profile.wantGoodFirstIssue && repo.hasGoodFirstIssues) {
    score += 4;
    reasons.push("Good first issue available");
  }
  if (repo.difficulty === profile.level) {
    score += 3;
    reasons.push(`Level match: ${profile.level}`);
  } else if (
    profile.level === "beginner" &&
    repo.difficulty === "intermediate"
  ) {
    score -= 2;
    reasons.push("Harder than beginner level");
  }

  return { score, reasons };
}

export function rankRepos<T extends ScorableRepo>(
  repos: T[],
  profile: StudentProfileInput,
  limit = 5,
): RankedRepo<T>[] {
  return repos
    .filter((repo) => passesFilters(repo, profile))
    .map((repo) => ({ repo, ...scoreRepo(repo, profile) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.repo.fullName.localeCompare(b.repo.fullName);
    })
    .slice(0, limit);
}

export function uniqueSorted(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }
  return result.sort((a, b) => a.localeCompare(b));
}
