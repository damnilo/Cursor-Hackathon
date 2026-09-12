import type { StudentProfileInput } from "../lib/matching";

export type SampleProfile = StudentProfileInput & {
  slug: string;
  label: string;
};

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    slug: "ts-react-beginner-web",
    label: "TypeScript + React beginner (web)",
    languages: ["TypeScript", "JavaScript"],
    stack: ["React", "Next.js"],
    topics: ["web", "frontend", "react"],
    level: "beginner",
    wantGoodFirstIssue: true,
  },
  {
    slug: "python-beginner-ml-docs",
    label: "Python beginner (ML / docs)",
    languages: ["Python"],
    stack: ["Python", "Pandas", "scikit-learn"],
    topics: ["machine-learning", "documentation", "data-science"],
    level: "beginner",
    wantGoodFirstIssue: true,
  },
  {
    slug: "go-intermediate-cli",
    label: "Go intermediate (CLI / DevOps)",
    languages: ["Go"],
    stack: ["Go", "Hugo"],
    topics: ["cli", "devops", "go"],
    level: "intermediate",
    wantGoodFirstIssue: false,
  },
  {
    slug: "js-beginner-docs",
    label: "JavaScript beginner (docs)",
    languages: ["JavaScript", "Markdown"],
    stack: ["JavaScript", "Markdown"],
    topics: ["documentation", "education", "website"],
    level: "beginner",
    wantGoodFirstIssue: true,
  },
  {
    slug: "rust-beginner-gfi",
    label: "Rust beginner (good first issue required)",
    languages: ["Rust"],
    stack: ["Rust"],
    topics: ["rust", "education", "linting"],
    level: "beginner",
    wantGoodFirstIssue: true,
  },
];
