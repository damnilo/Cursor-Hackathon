import Link from "next/link";
import { BackendStatus } from "./BackendStatus";

const previewChips = ["JavaScript", "beginner", "412k stars"];

function HeroMatchPreview() {
  return (
    <article className="animate-float-soft flex w-full max-w-[460px] shrink-0 flex-col gap-4 rounded-md border border-slate-700 bg-slate-900/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] lg:w-[460px]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sky-400">
          Match 01
        </p>
        <p className="rounded-sm bg-sky-500/15 px-2.5 py-1 font-mono text-[12px] font-medium text-sky-300">
          86/100
        </p>
      </div>
      <h2 className="font-mono text-lg font-medium text-slate-100">
        freeCodeCamp/freeCodeCamp
      </h2>
      <p className="text-sm leading-[1.6] text-slate-400">
        Learn to code for free. Beginner docs issues are labeled and scoped for a
        first PR.
      </p>
      <div className="flex flex-wrap gap-2">
        {previewChips.map((chip) => (
          <span
            key={chip}
            className="rounded-sm border border-slate-700 px-2 py-1 font-mono text-[11px] text-slate-400"
          >
            {chip}
          </span>
        ))}
      </div>
      <p className="text-sm text-slate-300">
        Written in JavaScript, which you already know. Has labeled good first
        issues.
      </p>
      <Link
        href="/profile"
        className="inline-flex h-9 w-fit items-center justify-center rounded-sm bg-sky-500 px-4 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-slate-950 transition hover:bg-sky-400"
      >
        Open plan
      </Link>
    </article>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <div className="animate-glow-shift pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(224,122,61,0.22),_transparent_68%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-14 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col items-start gap-6">
          <div className="animate-fade-up">
            <BackendStatus />
          </div>
          <p className="animate-fade-up font-mono text-[11px] uppercase tracking-[0.22em] text-sky-400 [animation-delay:80ms]">
            For students starting open source
          </p>
          <h1 className="animate-fade-up max-w-[680px] font-serif text-5xl leading-[1.05] text-slate-100 sm:text-6xl lg:text-[72px] [animation-delay:140ms]">
            Find your <span className="italic text-sky-400">first</span> open
            source contribution
          </h1>
          <p className="animate-fade-up max-w-[520px] text-lg leading-[1.65] text-slate-400 [animation-delay:220ms]">
            FirstContrib matches you with beginner-friendly repos, then writes a
            concrete first-PR plan. No account required.
          </p>
          <div className="animate-fade-up flex flex-col items-stretch gap-3 sm:flex-row sm:items-center [animation-delay:300ms]">
            <Link
              href="/profile"
              className="inline-flex h-12 items-center justify-center rounded-sm bg-sky-500 px-7 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Start with your profile
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-slate-600 px-7 text-sm font-medium text-slate-300 transition hover:border-sky-400 hover:text-slate-100"
            >
              See how it works
            </a>
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:360ms]">
          <HeroMatchPreview />
        </div>
      </div>
    </section>
  );
}
