"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { MatchCard } from "@/components/matches/MatchCard";
import { useSessionId } from "@/lib/session";
import { api } from "../../../convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [ranked, setRanked] = useState<typeof matches>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void seed({});
  }, [seed]);

  const shown = ranked ?? matches;
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
      setRanked(next);
    } catch {
      setRanked(undefined);
    } finally {
      setRefreshing(false);
    }
  }

  if (!sessionId || profile === undefined || matches === undefined) {
    return <p className="mt-8 text-slate-400">Scoring curated repositories…</p>;
  }

  if (!profile) {
    return (
      <p className="mt-8 text-slate-400">
        No profile yet.{" "}
        <Link href="/profile" className="text-sky-400 hover:text-sky-300">
          Start with your languages
        </Link>
        .
      </p>
    );
  }

  if (!shown || shown.length === 0) {
    return (
      <p className="mt-8 text-slate-400">
        No repositories passed the filters. Loosen languages or turn off the
        good-first-issue requirement.
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Showing {shown.length} matches for {profile.languages.join(", ")}.
          {ranked ? " Ranked for this session." : " Deterministic baseline."}
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
