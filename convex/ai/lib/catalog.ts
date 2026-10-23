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
