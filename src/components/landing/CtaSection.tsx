import Link from "next/link";

export function CtaSection() {
  return (
    <section className="px-6 pb-20 pt-4 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 border-t border-slate-800 pt-14 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <h2 className="font-serif text-4xl leading-[1.15] text-slate-100 sm:text-5xl">
            Ready to contribute?
          </h2>
          <p className="mt-4 leading-[1.65] text-slate-400">
            Fill a profile, get 3 to 5 ranked repos, open a first-PR plan, and mark
            it complete. No account required.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Link
            href="/profile"
            className="inline-flex h-12 items-center justify-center rounded-sm bg-sky-500 px-7 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Start with your profile
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Built for the hackathon · 50+ verified repos
          </p>
        </div>
      </div>
    </section>
  );
}
