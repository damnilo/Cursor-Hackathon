import { AppShell } from "@/components/AppShell";
import { MatchesPageClient } from "@/components/matches/MatchesPageClient";
import Link from "next/link";

export default function MatchesPage() {
  return (
    <AppShell>
      <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-sky-400">
        <Link href="/profile" className="hover:text-sky-300">
          ← Edit profile
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-4xl text-slate-100">Your matches</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
        A short ranked list for this profile. Open a card for the first-PR
        plan, mark it complete when you finish, then ask for the next one.
      </p>
      <MatchesPageClient />
    </AppShell>
  );
}
