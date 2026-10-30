"use client";

import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default function MatchDetailError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <AppShell>
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-slate-200">This plan page could not load.</p>
        <p className="mt-2 text-sm text-slate-400">
          {error.message || "Something went wrong while opening this match."}
        </p>
        <Link
          href="/matches"
          className="mt-4 inline-flex rounded-sm bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Back to matches
        </Link>
      </div>
    </AppShell>
  );
}
