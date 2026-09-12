export function CtaSection() {
  return (
    <section className="px-6 pb-24 pt-8 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-950/40 to-violet-950/40 p-10 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Ready to contribute?
        </h2>
        <p className="mt-4 text-slate-300">
          Phase 2 brings student profiles and repository matching. Stay tuned —
          your first open source win is closer than you think.
        </p>
        <p className="mt-8 text-sm text-slate-500">
          Built for the hackathon · {45} verified beginner-friendly repositories
          curated
        </p>
      </div>
    </section>
  );
}
