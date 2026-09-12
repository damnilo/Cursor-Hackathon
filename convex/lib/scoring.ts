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
  hasContributingGuide: boolean;
  primaryLanguage: string;
  stars: number;
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

function listPhrase(items: string[]): string {
  if (items.length === 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(", ")}, and ${last ?? ""}`;
}

/** 1 hit is enough for most of the weight; extra hits finish it. Never divide by how many chips the student picked. */
function overlapScore(hits: number, weight: number): number {
  if (hits <= 0) {
    return 0;
  }
  return weight * (hits >= 2 ? 1 : 0.7);
}

function languageScore(profile: MatchProfile, repo: ScorableRepo, hits: string[]): number {
  if (hits.length === 0) {
    return 0;
  }
  const preferred = profile.languages[0];
  const primary = repo.primaryLanguage;
  const primaryIsPreferred =
    Boolean(preferred) && normalize(primary) === normalize(preferred);
  const primaryIsKnown = overlap(profile.languages, [primary]).length > 0;
  if (primaryIsPreferred) {
    return WEIGHTS.language;
  }
  if (primaryIsKnown) {
    return Math.round(WEIGHTS.language * 0.85);
  }
  return Math.round(WEIGHTS.language * 0.65);
}

function starScore(stars: number): number {
  // log10(100)≈2 → 4, log10(10k)≈4 → 8, log10(100k)≈5 → 10
  return Math.min(10, Math.max(0, Math.round(Math.log10(Math.max(stars, 10)) * 2)));
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

  const gfiScore =
    profile.wantGoodFirstIssue && repo.hasGoodFirstIssues
      ? WEIGHTS.goodFirstIssue
      : 0;
  const difficultyScore =
    profile.level === repo.difficulty ? WEIGHTS.difficulty : 0;
  const guideScore = repo.hasContributingGuide ? 5 : 0;

  const score = Math.min(
    100,
    Math.round(
      languageScore(profile, repo, languageHits) +
        overlapScore(stackHits.length, WEIGHTS.stack) +
        overlapScore(topicHits.length, WEIGHTS.topics) +
        gfiScore +
        difficultyScore +
        guideScore +
        starScore(repo.stars),
    ),
  );

  const reasons: string[] = [];
  if (languageHits.length > 0) {
    reasons.push(
      `Written in ${listPhrase(languageHits)}, which you already know.`,
    );
  }
  if (stackHits.length > 0) {
    reasons.push(`Uses ${listPhrase(stackHits)} from your stack.`);
  }
  if (topicHits.length > 0) {
    reasons.push(
      `Covers ${listPhrase(topicHits)}, which you said you want to work on.`,
    );
  }
  if (gfiScore > 0) {
    reasons.push("Has labeled good first issues, so a first PR stays scoped.");
  }
  if (difficultyScore > 0) {
    reasons.push(
      profile.level === "beginner"
        ? "Marked beginner — the same level as your profile."
        : "Marked intermediate — the same level as your profile.",
    );
  }
  if (reasons.length === 0) {
    reasons.push("Passed the filters, but the overlap with your profile is thin.");
  }

  return { score, reasons };
}
