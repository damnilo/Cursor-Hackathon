type ExaSearchResponse = {
  results?: Array<{ url?: string }>;
};

/**
 * One-repo backup only. Do not call for matching or the whole catalog.
 */
export async function findContributingUrl(fullName: string): Promise<string | null> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.error("EXA_API_KEY is not set");
    return null;
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: `CONTRIBUTING site:github.com/${fullName}`,
      numResults: 3,
      type: "auto",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Exa search failed", response.status, body.slice(0, 400));
    return null;
  }

  const payload = (await response.json()) as ExaSearchResponse;
  const prefix = `https://github.com/${fullName}`.toLowerCase();
  for (const result of payload.results ?? []) {
    const url = result.url;
    if (typeof url !== "string") {
      continue;
    }
    const lower = url.toLowerCase();
    if (lower.startsWith(prefix) && /contribut/i.test(url)) {
      return url;
    }
  }
  for (const result of payload.results ?? []) {
    const url = result.url;
    if (typeof url === "string" && url.toLowerCase().startsWith(prefix)) {
      return url;
    }
  }
  return null;
}
