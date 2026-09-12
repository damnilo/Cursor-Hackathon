import { AuthButtons } from "@/components/auth/AuthButtons";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-800 px-6 sm:px-10 lg:px-16">
      <Link href="/" className="group flex shrink-0 flex-col">
        <span className="font-serif text-[26px] leading-none text-slate-100">
          FirstContrib
        </span>
        <span className="mt-1 h-px w-10 origin-left animate-rule-in bg-sky-500 transition-all group-hover:w-full" />
      </Link>
      <div className="flex items-center gap-7">
        <nav className="hidden items-center gap-6 font-mono text-[12px] uppercase tracking-[0.16em] text-slate-400 sm:flex">
          <Link href="/#how-it-works" className="transition hover:text-slate-100">
            How it works
          </Link>
          <Link href="/profile" className="transition hover:text-slate-100">
            Profile
          </Link>
          <Link href="/matches" className="transition hover:text-slate-100">
            Matches
          </Link>
        </nav>
        <AuthButtons />
      </div>
    </header>
  );
}
