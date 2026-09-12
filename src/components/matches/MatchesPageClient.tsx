"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { MatchCard } from "@/components/matches/MatchCard";
import { useSessionId } from "@/lib/session";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect } from "react";

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
  const profile = useQuery(
    api.profiles.getBySession,
    sessionId ? { sessionId } : "skip",
  );
  const matches = useQuery(
    api.matching.matchRepos,
    sessionId ? { sessionId, limit: 5 } : "skip",
  );

  useEffect(() => {
    void seed({});
  }, [seed]);

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

  if (matches.length === 0) {
    return (
      <p className="mt-8 text-slate-400">
        No repositories passed the filters. Loosen languages or turn off the
        good-first-issue requirement.
      </p>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <p className="text-sm text-slate-400">
        Showing {matches.length} of the top deterministic matches for{" "}
        {profile.languages.join(", ")}.
      </p>
      {matches.map((match, index) => (
        <MatchCard
          key={match.repositoryId}
          rank={index + 1}
          fullName={match.fullName}
          url={match.url}
          description={match.description}
          primaryLanguage={match.primaryLanguage}
          difficulty={match.difficulty}
          stars={match.stars}
          score={match.score}
          reasons={match.reasons}
          newcomerNote={match.newcomerNote}
        />
      ))}
    </div>
  );
}
