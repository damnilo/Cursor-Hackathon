const FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape";
const MAX_MARKDOWN = 40_000;

type FirecrawlResponse = {
  success?: boolean;
  data?: { markdown?: string };
};

export async function scrapeMarkdown(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("FIRECRAWL_API_KEY is not set");
    return null;
  }

  const response = await fetch(FIRECRAWL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Firecrawl failed", url, response.status, body.slice(0, 400));
    return null;
  }

  const payload = (await response.json()) as FirecrawlResponse;
  const markdown = payload.data?.markdown;
  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return null;
  }
  return markdown.slice(0, MAX_MARKDOWN);
}

export function repoRootUrl(githubUrl: string): string {
  return githubUrl.replace(/\/$/, "");
}

function resolveRepoHref(href: string, repoUrl: string): string | null {
  const cleaned = href.trim().replace(/^<|>$/g, "").split(/\s+/)[0];
  if (!cleaned || cleaned.startsWith("#") || cleaned.startsWith("mailto:")) {
    return null;
  }
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }
  const root = repoRootUrl(repoUrl);
  const path = cleaned.replace(/^\.\//, "").replace(/^\//, "");
  return `${root}/blob/HEAD/${path}`;
}

export function extractContributingUrls(
  markdown: string,
  repoUrl: string,
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const add = (url: string | null) => {
    if (!url || seen.has(url)) {
      return;
    }
    seen.add(url);
    urls.push(url);
  };

  const mdLink = /\[[^\]]*\]\(([^)\s]+)\)/g;
  let match = mdLink.exec(markdown);
  while (match) {
    const href = match[1] ?? "";
    const around = markdown.slice(
      Math.max(0, match.index - 24),
      match.index + match[0].length,
    );
    if (/contribut/i.test(href) || /contribut/i.test(around)) {
      add(resolveRepoHref(href, repoUrl));
    }
    match = mdLink.exec(markdown);
  }

  const bare = /https?:\/\/github\.com\/[^\s)]+/gi;
  let bareMatch = bare.exec(markdown);
  while (bareMatch) {
    const url = bareMatch[0];
    if (/contribut/i.test(url)) {
      add(url);
    }
    bareMatch = bare.exec(markdown);
  }

  return urls;
}

export function contributingFallbackUrls(githubUrl: string): string[] {
  const root = repoRootUrl(githubUrl);
  const paths = [
    "CONTRIBUTING.md",
    "docs/CONTRIBUTING.md",
    ".github/CONTRIBUTING.md",
    "CONTRIBUTING.rst",
    "docs/contributing.md",
  ];
  const refs = ["HEAD", "main", "master"];
  const urls: string[] = [];
  for (const ref of refs) {
    for (const path of paths) {
      urls.push(`${root}/blob/${ref}/${path}`);
    }
  }
  return urls;
}

export async function scrapeFirstMarkdown(urls: string[]): Promise<string | null> {
  const tried = new Set<string>();
  for (const url of urls) {
    if (tried.has(url)) {
      continue;
    }
    tried.add(url);
    const markdown = await scrapeMarkdown(url);
    if (markdown) {
      return markdown;
    }
  }
  return null;
}
