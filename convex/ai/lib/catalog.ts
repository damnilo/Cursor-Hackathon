// Chip lists live in convex/lib/chips.ts. The form re-exports the same arrays.
import {
  LANGUAGE_OPTIONS,
  STACK_OPTIONS,
  TOPIC_OPTIONS,
} from "../../lib/chips";

export { LANGUAGE_OPTIONS, STACK_OPTIONS, TOPIC_OPTIONS };

const languageMap = new Map(
  LANGUAGE_OPTIONS.map((value) => [value.toLowerCase(), value]),
);
const stackMap = new Map(
  STACK_OPTIONS.map((value) => [value.toLowerCase(), value]),
);
const topicMap = new Map(
  TOPIC_OPTIONS.map((value) => [value.toLowerCase(), value]),
);

const synonyms: Record<string, string> = {
  ts: "TypeScript",
  typescript: "TypeScript",
  js: "JavaScript",
  javascript: "JavaScript",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  next: "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  reactjs: "React",
  react: "frontend",
  py: "Python",
  golang: "Go",
  cpp: "C++",
  "c++": "C++",
  c: "C",
  csharp: "C#",
  "c#": "C#",
  "c sharp": "C#",
  java: "Java",
  kotlin: "Kotlin",
  docker: "Docker",
  terraform: "Terraform",
  pytorch: "PyTorch",
  "py torch": "PyTorch",
  fastapi: "FastAPI",
  "fast api": "FastAPI",
  arduino: "Arduino",
  platformio: "PlatformIO",
  "platform io": "PlatformIO",
  ml: "machine-learning",
  "machine learning": "machine-learning",
  docs: "documentation",
  k8s: "Kubernetes",
  mlops: "mlops",
  "ml ops": "mlops",
  embedded: "embedded",
  firmware: "firmware",
  cloud: "cloud",
  systems: "systems",
  system: "systems",
};

// Phrases a CV may use for a catalog chip. Bare English words such as "next"
// stay off this list so a sentence does not become a stack chip.
const CV_SYNONYMS: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  py: "Python",
  golang: "Go",
  cpp: "C++",
  csharp: "C#",
  "c sharp": "C#",
  reactjs: "React",
  "react.js": "React",
  "vue.js": "Vue",
  node: "Node.js",
  nodejs: "Node.js",
  nextjs: "Next.js",
  "fast api": "FastAPI",
  "py torch": "PyTorch",
  "platform io": "PlatformIO",
  k8s: "Kubernetes",
  "machine learning": "machine-learning",
  "data science": "data-science",
  "open source": "open-source",
  "front end": "frontend",
  "front-end": "frontend",
  "back end": "backend",
  "back-end": "backend",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textHasPhrase(text: string, phrase: string): boolean {
  const body = phrase.trim();
  if (!body) {
    return false;
  }
  const escaped = escapeRegExp(body).replace(/\s+/g, "\\s+");
  const lower = body.toLowerCase();
  const before = lower === "js" || lower === "ts" || lower === "py"
    ? "[A-Za-z0-9.]"
    : "[A-Za-z0-9]";
  const after = lower === "c" ? "[A-Za-z0-9+#]" : "[A-Za-z0-9]";
  return new RegExp(`(?<!${before})${escaped}(?!${after})`, "i").test(text);
}

export function chipsFromText(text: string): {
  languages: string[];
  stack: string[];
  topics: string[];
} {
  const groups = [
    { kind: "languages" as const, options: LANGUAGE_OPTIONS },
    { kind: "stack" as const, options: STACK_OPTIONS },
    { kind: "topics" as const, options: TOPIC_OPTIONS },
  ];
  const found = {
    languages: [] as string[],
    stack: [] as string[],
    topics: [] as string[],
  };
  for (const group of groups) {
    const allowed = new Set<string>(group.options as readonly string[]);
    const phrases: string[] = [...group.options];
    for (const [alias, canonical] of Object.entries(CV_SYNONYMS)) {
      if (allowed.has(canonical)) {
        phrases.push(alias);
      }
    }
    const hits = phrases.filter((phrase) => textHasPhrase(text, phrase));
    found[group.kind] = pickAllowed(hits, group.kind);
  }
  return found;
}

function canonicalize(
  raw: string,
  allowed: Map<string, string>,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const lower = trimmed.toLowerCase();
  const fromSynonym = synonyms[lower];
  if (fromSynonym && allowed.has(fromSynonym.toLowerCase())) {
    return allowed.get(fromSynonym.toLowerCase()) ?? fromSynonym;
  }
  return allowed.get(lower) ?? null;
}

export function pickAllowed(
  values: string[],
  kind: "languages" | "stack" | "topics",
): string[] {
  const allowed =
    kind === "languages"
      ? languageMap
      : kind === "stack"
        ? stackMap
        : topicMap;
  const out: string[] = [];
  for (const value of values) {
    const canonical = canonicalize(value, allowed);
    if (canonical && !out.includes(canonical)) {
      out.push(canonical);
    }
  }
  return out;
}
