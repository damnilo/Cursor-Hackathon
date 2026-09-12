"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { MatchCard } from "@/components/matches/MatchCard";
import { RankingWait } from "@/components/matches/StatusCycle";
import { useSessionId } from "@/lib/session";
import { api } from "../../../convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function MatchesPageClient() {
  if (!isConvexConfigured()) {
    return (
      <p className="mt-8 text-slate-400">
        Set NEXT_PUBLIC_CONVEX_URL and run `npx convex dev` to load matches.
      </p>
    );
  }

  return <MatchesList />;
}

function MatchesList() {
  const sessionId = useSessionId();
  const seed = useMutation(api.seed.seedRepositories);
  const rankMatches = useAction(api.ai.rank.rankMatches);
  const profile = useQuery(
    api.profiles.getBySession,
    sessionId ? { sessionId } : "skip",
  );
  const matches = useQuery(
    api.matching.matchRepos,
    sessionId ? { sessionId, limit: 5 } : "skip",
  );
  const contributions = useQuery(
    api.contributions.listBySession,
    sessionId ? { sessionId } : "skip",
  );
  const [rankResult, setRankResult] = useState<{
    key: string;
    items: NonNullable<typeof matches> | null;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const matchKey = useMemo(
    () => matches?.map((match) => match.repositoryId).join(",") ?? "",
    [matches],
  );

  useEffect(() => {
    void seed({});
  }, [seed]);

  const rankedReady = rankResult?.key === matchKey;
  const shown = rankedReady ? (rankResult.items ?? matches) : matches;
  const completedIds = new Set(
    (contributions ?? [])
      .filter((row) => row.status === "completed")
      .map((row) => row.repositoryId),
  );

  async function refresh() {
    if (!sessionId) {
      return;
    }
    setRefreshing(true);
    try {
      await seed({});
      const next = await rankMatches({ sessionId, limit: 5 });
      setRankResult({ key: matchKey, items: next });
    } catch {
      setRankResult({ key: matchKey, items: null });
    } finally {
      setRefreshing(false);
    }
  }

  if (!sessionId || profile === undefined || matches === undefined) {
    return <RankingWait />;
  }

  if (!profile) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-slate-200">No profile on this browser yet.</p>
        <p className="mt-2 text-sm text-slate-400">
          Pick at least one language so we can score beginner-friendly repos.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Start with your profile
        </Link>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-slate-200">No repositories passed your filters.</p>
        <p className="mt-2 text-sm text-slate-400">
          Add another language, or turn off “only good first issues” on your
          profile and try again.
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400"
        >
          Edit profile
        </Link>
      </div>
    );
  }

  if (!shown) {
    return <RankingWait />;
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Top {shown.length} matches for {profile.languages.join(", ")}.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400 disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh recommendations"}
        </button>
      </div>
      {shown.map((match, index) => (
        <MatchCard
          key={match.repositoryId}
          rank={index + 1}
          repositoryId={match.repositoryId}
          fullName={match.fullName}
          url={match.url}
          description={match.description}
          primaryLanguage={match.primaryLanguage}
          difficulty={match.difficulty}
          stars={match.stars}
          score={match.score}
          reasons={match.reasons}
          newcomerNote={match.newcomerNote}
          completed={completedIds.has(match.repositoryId)}
        />
      ))}
    </div>
  );
}
