import { AppShell } from "@/components/AppShell";
import { MatchDetailClient } from "@/components/matches/MatchDetailClient";
import Link from "next/link";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;

  return (
    <AppShell>
      <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-sky-400">
        <Link href="/matches" className="hover:text-sky-300">
          ← All matches
        </Link>
      </p>
      <MatchDetailClient repositoryId={repositoryId} />
    </AppShell>
  );
}
