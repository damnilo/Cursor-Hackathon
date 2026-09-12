import { AppShell } from "@/components/AppShell";
import { FixturesPageClient } from "@/components/fixtures/FixturesPageClient";

export default function FixturesPage() {
  return (
    <AppShell>
      <p className="text-sm font-medium text-sky-400">Baseline check</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Five test profiles</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
        Hard-coded personas run through the same filter and scoring as the live
        matcher. This page is a test — it does not call Grok ranking.
      </p>
      <FixturesPageClient />
    </AppShell>
  );
}
