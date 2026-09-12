import { AppShell } from "@/components/AppShell";
import { FixturesPageClient } from "@/components/fixtures/FixturesPageClient";

export default function FixturesPage() {
  return (
    <AppShell>
      <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-sky-400">
        Baseline check
      </p>
      <h1 className="mt-4 font-serif text-4xl text-slate-100">Five test profiles</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
        Hard-coded personas run through the same filter and scoring as the live
        matcher. This page is a test — it does not call Grok ranking.
      </p>
      <FixturesPageClient />
    </AppShell>
  );
}
