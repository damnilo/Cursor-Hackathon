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

export function contributingUrl(githubUrl: string): string {
  const cleaned = githubUrl.replace(/\/$/, "");
  return `${cleaned}/blob/main/CONTRIBUTING.md`;
}
