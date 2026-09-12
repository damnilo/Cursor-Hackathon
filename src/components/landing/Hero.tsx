import { BackendStatus } from "./BackendStatus";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:px-10 sm:pt-24 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.15),_transparent_55%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <BackendStatus />
        <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Find your first{" "}
          <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
            open source
          </span>{" "}
          contribution
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
          FirstContrib matches students with beginner-friendly repositories —
          so your first PR is a learning experience, not a wall of confusion.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#how-it-works"
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            See how it works
          </a>
          <span className="rounded-full border border-slate-600 px-8 py-3 text-sm font-medium text-slate-300">
            Student profiles — coming in Phase 2
          </span>
        </div>
      </div>
    </section>
  );
}
