"use node";

// OWNER: colleague (AI). Prefill catalog chips from a PDF. Does not match or plan.
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { difficultyValidator } from "../lib/validators";
import { grokJson } from "./lib/grok";
import {
  LANGUAGE_OPTIONS,
  pickAllowed,
  STACK_OPTIONS,
  TOPIC_OPTIONS,
} from "./lib/catalog";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_PDF_BYTES = 8 * 1024 * 1024;
const MIN_TEXT_CHARS = 40;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

type ParseCvResult = {
  languages: string[];
  stack: string[];
  topics: string[];
  level: "beginner" | "intermediate";
  wantGoodFirstIssue: boolean;
  error: string | null;
};

function failed(message: string): ParseCvResult {
  return {
    languages: [],
    stack: [],
    topics: [],
    level: "beginner",
    wantGoodFirstIssue: true,
    error: message,
  };
}

async function pdfText(buffer: Buffer): Promise<string | null> {
  try {
    const document = await getDocumentProxy(new Uint8Array(buffer));
    const extracted = await extractText(document, { mergePages: true });
    const raw = extracted.text;
    const text = Array.isArray(raw) ? raw.join(" ") : raw;
    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("CV PDF text extract failed", error);
    return null;
  }
}

export const parseCv = action({
  args: { sessionId: v.string() },
  returns: v.object({
    languages: v.array(v.string()),
    stack: v.array(v.string()),
    topics: v.array(v.string()),
    level: difficultyValidator,
    wantGoodFirstIssue: v.boolean(),
    error: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    if (args.sessionId.trim().length < 8) {
      return failed("Invalid session. Pick chips manually.");
    }

    const profile = await ctx.runQuery(api.profiles.getBySession, {
      sessionId: args.sessionId,
    });
    if (!profile?.cvStorageId) {
      return failed("CV file not found. Pick chips manually.");
    }

    const blob = await ctx.storage.get(profile.cvStorageId);
    if (!blob) {
      return failed("CV file not found. Pick chips manually.");
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_PDF_BYTES) {
      return failed("PDF must be under 8 MB. Pick chips manually.");
    }
    if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
      return failed("Only PDF files can be parsed. Pick chips manually.");
    }

    const text = await pdfText(buffer);
    if (text === null) {
      return failed("Could not read that PDF. Pick chips manually.");
    }
    if (text.length < MIN_TEXT_CHARS) {
      return failed("No readable text in that PDF. Pick chips manually.");
    }

    const grokResult = await grokJson(
      "You map a student CV onto a fixed chip catalog for an open-source matching app. Return ONLY JSON.",
      JSON.stringify({
        cvText: text.slice(0, 12000),
        allowedLanguages: LANGUAGE_OPTIONS,
        allowedStack: STACK_OPTIONS,
        allowedTopics: TOPIC_OPTIONS,
        instructions:
          "Pick languages, stack, and topics ONLY from the allowed lists. Map synonyms (C#, C sharp, PyTorch, FastAPI, MLOps, embedded) onto those lists. Do not invent chips. level is beginner or intermediate. wantGoodFirstIssue is a boolean — true unless the CV clearly shows prior open-source maintainership.",
      }),
    );

    if (!isRecord(grokResult)) {
      return failed("Could not map the CV to chips. Pick chips manually.");
    }

    const languages = pickAllowed(asStringArray(grokResult.languages), "languages");
    const stack = pickAllowed(asStringArray(grokResult.stack), "stack");
    const topics = pickAllowed(asStringArray(grokResult.topics), "topics");

    if (languages.length === 0 && stack.length === 0 && topics.length === 0) {
      return failed("No catalog chips found in the CV. Pick chips manually.");
    }

    const result: ParseCvResult = {
      languages,
      stack,
      topics,
      level: grokResult.level === "intermediate" ? "intermediate" : "beginner",
      wantGoodFirstIssue:
        typeof grokResult.wantGoodFirstIssue === "boolean"
          ? grokResult.wantGoodFirstIssue
          : true,
      error: null,
    };
    return result;
  },
});
