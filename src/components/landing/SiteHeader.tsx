import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sm font-bold text-sky-300">
          FC
        </div>
        <span className="text-lg font-semibold text-white">FirstContrib</span>
      </Link>
      <nav className="hidden gap-6 text-sm text-slate-400 sm:flex">
        <Link href="/#how-it-works" className="transition hover:text-white">
          How it works
        </Link>
        <Link href="/profile" className="transition hover:text-white">
          Profile
        </Link>
        <Link href="/matches" className="transition hover:text-white">
          Matches
        </Link>
        <Link href="/fixtures" className="transition hover:text-white">
          Test profiles
        </Link>
      </nav>
    </header>
  );
}
