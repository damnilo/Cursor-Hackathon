import Link from "next/link";

export default function MatchesPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-sky-400">
        <Link href="/profile" className="hover:text-sky-300">
          ← Profile
        </Link>
      </p>
      <h1 className="mt-6 text-3xl font-bold text-white">Your matches</h1>
      <p className="mt-4 leading-relaxed text-slate-400">
        Phase 2 will show 3–5 repositories with an explainable score: language
        overlap, stack, topics, and good-first-issue fit.
      </p>
    </main>
  );
}
