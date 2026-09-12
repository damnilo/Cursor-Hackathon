import { AppShell } from "@/components/AppShell";
import { MatchesPageClient } from "@/components/matches/MatchesPageClient";
import Link from "next/link";

export default function MatchesPage() {
  return (
    <AppShell>
      <p className="text-sm font-medium text-sky-400">
        <Link href="/profile" className="hover:text-sky-300">
          ← Edit profile
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-white">Your matches</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
        We wait for the ranked shortlist before showing cards. Open one for the
        first-contribution plan and mark it complete when you finish.
      </p>
      <MatchesPageClient />
    </AppShell>
  );
}
