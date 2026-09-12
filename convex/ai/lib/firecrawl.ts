import { fetchWithTimeout } from "./http";

const FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape";
const MAX_MARKDOWN = 40_000;
const SCRAPE_TIMEOUT_MS = 8_000;
const MAX_FALLBACK_URLS = 4;

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

  let response: Response;
  try {
    response = await fetchWithTimeout(
      FIRECRAWL_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
        }),
      },
      SCRAPE_TIMEOUT_MS,
    );
  } catch (error) {
    console.error("Firecrawl timed out or failed", url, error);
    return null;
  }

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
  return [
    `${root}/blob/HEAD/CONTRIBUTING.md`,
    `${root}/blob/HEAD/.github/CONTRIBUTING.md`,
    `${root}/blob/HEAD/docs/CONTRIBUTING.md`,
    `${root}/blob/main/CONTRIBUTING.md`,
  ];
}

export async function scrapeFirstMarkdown(urls: string[]): Promise<string | null> {
  const unique: string[] = [];
  for (const url of urls) {
    if (!unique.includes(url)) {
      unique.push(url);
    }
    if (unique.length >= MAX_FALLBACK_URLS) {
      break;
    }
  }
  if (unique.length === 0) {
    return null;
  }
  const results = await Promise.all(unique.map((url) => scrapeMarkdown(url)));
  return results.find((markdown) => markdown) ?? null;
}
