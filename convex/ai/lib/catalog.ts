// Mirrors src/lib/catalogs.ts so Grok can only emit chips the UI already offers.
export const LANGUAGE_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "C++",
  "C",
  "C#",
  "Java",
  "Kotlin",
  "Ruby",
  "PHP",
  "Markdown",
  "Shell",
] as const;

export const STACK_OPTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "Tailwind",
  "Vue",
  "Django",
  "Prisma",
  "Vite",
  "Kubernetes",
  "Pandas",
  "Docker",
  "Terraform",
  "PyTorch",
  "FastAPI",
  "Arduino",
  "PlatformIO",
] as const;

export const TOPIC_OPTIONS = [
  "frontend",
  "backend",
  "documentation",
  "beginner",
  "education",
  "cli",
  "devops",
  "machine-learning",
  "web",
  "open-source",
  "git",
  "testing",
  "data-science",
  "embedded",
  "mlops",
  "firmware",
  "cloud",
  "systems",
] as const;

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
  embedded: "embedded",
  firmware: "firmware",
  mlops: "mlops",
  "ml ops": "mlops",
  "ml-ops": "mlops",
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
