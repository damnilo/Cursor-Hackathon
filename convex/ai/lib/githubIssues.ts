export type GithubIssue = {
  number: number;
  title: string;
  html_url: string;
  labels: string[];
  body: string;
};

type GithubIssueJson = {
  number?: number;
  title?: string;
  html_url?: string;
  labels?: Array<string | { name?: string }>;
  body?: string | null;
  pull_request?: unknown;
};

type SearchResponse = {
  items?: GithubIssueJson[];
};

const BODY_LIMIT = 1500;
const MAX_ISSUES = 5;

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "FirstContrib",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function labelNames(labels: GithubIssueJson["labels"]): string[] {
  if (!labels) {
    return [];
  }
  return labels
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}

function toIssue(raw: GithubIssueJson): GithubIssue | null {
  if (raw.pull_request) {
    return null;
  }
  if (
    typeof raw.number !== "number" ||
    typeof raw.title !== "string" ||
    typeof raw.html_url !== "string"
  ) {
    return null;
  }
  const body =
    typeof raw.body === "string"
      ? raw.body.replace(/\s+/g, " ").trim().slice(0, BODY_LIMIT)
      : "";
  return {
    number: raw.number,
    title: raw.title,
    html_url: raw.html_url,
    labels: labelNames(raw.labels),
    body,
  };
}

async function searchIssues(owner: string, name: string): Promise<GithubIssue[]> {
  const query = [
    `repo:${owner}/${name}`,
    "is:issue",
    "is:open",
    '(label:"good first issue" OR label:"good-first-issue" OR label:"help wanted" OR label:"help-wanted")',
  ].join(" ");
  const url = `https://api.github.com/search/issues?per_page=${MAX_ISSUES}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    const text = await response.text();
    console.error("GitHub search failed", response.status, text.slice(0, 300));
    return [];
  }
  const payload = (await response.json()) as SearchResponse;
  const issues: GithubIssue[] = [];
  const seen = new Set<string>();
  for (const item of payload.items ?? []) {
    const issue = toIssue(item);
    if (!issue || seen.has(issue.html_url)) {
      continue;
    }
    seen.add(issue.html_url);
    issues.push(issue);
    if (issues.length >= MAX_ISSUES) {
      break;
    }
  }
  return issues;
}

async function listLabeledIssues(
  owner: string,
  name: string,
  label: string,
): Promise<GithubIssue[]> {
  const url =
    `https://api.github.com/repos/${owner}/${name}/issues` +
    `?state=open&labels=${encodeURIComponent(label)}&per_page=${MAX_ISSUES}`;
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as GithubIssueJson[];
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .map(toIssue)
    .filter((issue): issue is GithubIssue => issue !== null);
}

/**
 * 3–5 open beginner issues for one already-chosen repo. Never used to rank the catalog.
 */
export async function fetchBeginnerIssues(
  owner: string,
  name: string,
): Promise<GithubIssue[]> {
  const fromSearch = await searchIssues(owner, name);
  if (fromSearch.length >= 3) {
    return fromSearch.slice(0, MAX_ISSUES);
  }

  const extras = [
    ...(await listLabeledIssues(owner, name, "good first issue")),
    ...(await listLabeledIssues(owner, name, "help wanted")),
  ];
  const merged = [...fromSearch];
  const seen = new Set(fromSearch.map((issue) => issue.html_url));
  for (const issue of extras) {
    if (seen.has(issue.html_url)) {
      continue;
    }
    seen.add(issue.html_url);
    merged.push(issue);
    if (merged.length >= MAX_ISSUES) {
      break;
    }
  }
  return merged.slice(0, MAX_ISSUES);
}

export function pickAllowedIssueUrl(
  candidate: string | undefined,
  issues: GithubIssue[],
): string | undefined {
  if (!candidate || issues.length === 0) {
    return undefined;
  }
  const allowed = new Set(issues.map((issue) => issue.html_url));
  return allowed.has(candidate) ? candidate : undefined;
}
