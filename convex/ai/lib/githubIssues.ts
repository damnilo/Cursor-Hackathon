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
const BEGINNER_LABELS = [
  "good first issue",
  "good-first-issue",
  "help wanted",
  "help-wanted",
];

function readGithubToken(): string | undefined {
  const raw = process.env.GITHUB_TOKEN?.trim().replace(/^["']|["']$/g, "");
  return raw && raw.length > 0 ? raw : undefined;
}

function githubHeaders(useToken: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "FirstContrib",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = useToken ? readGithubToken() : undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function githubGet(url: string): Promise<Response> {
  const token = readGithubToken();
  let authed: Response;
  try {
    authed = await fetch(url, {
      headers: githubHeaders(true),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    console.error("GitHub timed out or failed", url, error);
    return new Response(null, { status: 504 });
  }
  if (authed.ok) {
    return authed;
  }
  if (token && (authed.status === 401 || authed.status === 403)) {
    const body = await authed.text();
    console.error(
      "GITHUB_TOKEN rejected by GitHub",
      authed.status,
      body.slice(0, 240),
      "— retrying this request without the token (fine-grained PATs often fail Search API).",
    );
    try {
      return await fetch(url, {
        headers: githubHeaders(false),
        signal: AbortSignal.timeout(8_000),
      });
    } catch (error) {
      console.error("GitHub retry timed out or failed", url, error);
      return new Response(null, { status: 504 });
    }
  }
  if (!authed.ok) {
    const body = await authed.text();
    console.error("GitHub request failed", authed.status, url, body.slice(0, 240));
  }
  return authed;
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

function mergeIssues(groups: GithubIssue[][]): GithubIssue[] {
  const seen = new Set<string>();
  const merged: GithubIssue[] = [];
  for (const group of groups) {
    for (const issue of group) {
      if (seen.has(issue.html_url)) {
        continue;
      }
      seen.add(issue.html_url);
      merged.push(issue);
      if (merged.length >= MAX_ISSUES) {
        return merged;
      }
    }
  }
  return merged;
}

async function searchIssues(owner: string, name: string): Promise<GithubIssue[]> {
  const query = [
    `repo:${owner}/${name}`,
    "is:issue",
    "is:open",
    '(label:"good first issue" OR label:"good-first-issue" OR label:"help wanted" OR label:"help-wanted")',
  ].join(" ");
  const url = `https://api.github.com/search/issues?per_page=${MAX_ISSUES}&q=${encodeURIComponent(query)}`;
  const response = await githubGet(url);
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as SearchResponse;
  return (payload.items ?? [])
    .map(toIssue)
    .filter((issue): issue is GithubIssue => issue !== null);
}

async function listLabeledIssues(
  owner: string,
  name: string,
  label: string,
): Promise<GithubIssue[]> {
  const url =
    `https://api.github.com/repos/${owner}/${name}/issues` +
    `?state=open&labels=${encodeURIComponent(label)}&per_page=${MAX_ISSUES}`;
  const response = await githubGet(url);
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
  const token = readGithubToken();
  console.log(
    "GitHub issues fetch",
    `${owner}/${name}`,
    token
      ? `token=${token.startsWith("github_pat_") ? "fine-grained" : token.startsWith("ghp_") ? "classic" : "unknown"}`
      : "token=missing",
  );

  const primary = await listLabeledIssues(owner, name, BEGINNER_LABELS[0]!);
  if (primary.length > 0) {
    return primary.slice(0, MAX_ISSUES);
  }

  const labeled = await Promise.all(
    BEGINNER_LABELS.slice(1).map((label) => listLabeledIssues(owner, name, label)),
  );
  const fromLabels = mergeIssues(labeled);
  if (fromLabels.length >= 1) {
    return fromLabels;
  }

  const fromSearch = await searchIssues(owner, name);
  return mergeIssues([fromLabels, fromSearch]);
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

export function pickIssueForKind(
  kind: "first" | "next",
  issues: GithubIssue[],
  grokUrl: string | undefined,
  previousUrl: string | undefined,
): GithubIssue | undefined {
  if (issues.length === 0) {
    return undefined;
  }

  if (kind === "next" && issues.length > 1 && previousUrl) {
    const grokPick = issues.find((issue) => issue.html_url === grokUrl);
    if (grokPick && grokPick.html_url !== previousUrl) {
      return grokPick;
    }
    return issues.find((issue) => issue.html_url !== previousUrl) ?? issues[0];
  }

  const allowed = pickAllowedIssueUrl(grokUrl, issues);
  if (allowed) {
    return issues.find((issue) => issue.html_url === allowed);
  }
  return issues[0];
}
