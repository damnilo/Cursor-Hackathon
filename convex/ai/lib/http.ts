/** Abort hung Firecrawl / GitHub / Exa / Grok calls so one repo cannot block the plan. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}
