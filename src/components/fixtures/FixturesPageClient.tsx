"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { MatchCard } from "@/components/matches/MatchCard";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

export function FixturesPageClient() {
  if (!isConvexConfigured()) {
    return (
      <p className="mt-8 text-slate-400">
        Set NEXT_PUBLIC_CONVEX_URL and run `npx convex dev` to run fixtures.
      </p>
    );
  }

  return <FixtureResults />;
}

function FixtureResults() {
  const seed = useMutation(api.seed.seedRepositories);
  const results = useQuery(api.fixtures.runBaselineTests);

  useEffect(() => {
    void seed({});
  }, [seed]);

  if (results === undefined) {
    return <p className="mt-8 text-slate-400">Running five student profiles…</p>;
  }

  return (
    <div className="mt-10 space-y-12">
      {results.map((fixture) => (
        <section key={fixture.name}>
          <h2 className="text-xl font-semibold text-white">{fixture.name}</h2>
          <p className="mt-2 text-sm text-slate-400">
            {fixture.candidateCount} repos passed filters · showing top{" "}
            {fixture.matches.length}
          </p>
          <div className="mt-4 space-y-4">
            {fixture.matches.map((match, index) => (
              <MatchCard
                key={`${fixture.name}-${match.repositoryId}`}
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
        </section>
      ))}
    </div>
  );
}
