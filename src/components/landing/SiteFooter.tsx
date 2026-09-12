import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-slate-800 px-6 py-7 text-sm sm:flex-row sm:px-10 lg:px-16">
      <p className="font-serif text-lg text-slate-500">FirstContrib</p>
      <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
        <Link href="/profile" className="transition hover:text-slate-100">
          Profile
        </Link>
        <Link href="/matches" className="transition hover:text-slate-100">
          Matches
        </Link>
        <Link href="/fixtures" className="transition hover:text-slate-100">
          Test profiles
        </Link>
      </nav>
    </footer>
  );
}
