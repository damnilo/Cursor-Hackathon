import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-sky-400">
        <Link href="/" className="hover:text-sky-300">
          ← FirstContrib
        </Link>
      </p>
      <h1 className="mt-6 text-3xl font-bold text-white">Student profile</h1>
      <p className="mt-4 leading-relaxed text-slate-400">
        Phase 2 will collect languages, stack, topics, level, and whether you
        want a good first issue — then match you with 3–5 curated repos. Nothing
        is saved to an account.
      </p>
      <Link
        href="/matches"
        className="mt-10 inline-flex w-fit rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
      >
        Preview matches page
      </Link>
    </main>
  );
}
