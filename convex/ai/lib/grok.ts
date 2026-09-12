import { fetchWithTimeout } from "./http";

const GROK_URL = "https://api.x.ai/v1/chat/completions";
const GROK_MODEL = "grok-3-mini";
const GROK_TIMEOUT_MS = 20_000;

type GrokResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Grok did not return JSON");
  }
  return JSON.parse(text.slice(start, end + 1)) as unknown;
}

export async function grokJson(system: string, user: string): Promise<unknown | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error("XAI_API_KEY is not set");
    return null;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      GROK_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          temperature: 0,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      },
      GROK_TIMEOUT_MS,
    );
  } catch (error) {
    console.error("Grok timed out or failed", error);
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("Grok request failed", response.status, body.slice(0, 500));
    return null;
  }

  const payload = (await response.json()) as GrokResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    return null;
  }

  try {
    return extractJsonObject(content);
  } catch (error) {
    console.error("Grok JSON parse failed", error);
    return null;
  }
}
