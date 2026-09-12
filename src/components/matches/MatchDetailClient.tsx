"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { PlanWait } from "@/components/matches/StatusCycle";
import { useSessionId } from "@/lib/session";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MatchDetailClient({ repositoryId }: { repositoryId: string }) {
  if (!isConvexConfigured()) {
    return (
      <p className="mt-8 text-slate-400">
        Set NEXT_PUBLIC_CONVEX_URL and run `npx convex dev`.
      </p>
    );
  }

  return <MatchDetail repositoryId={repositoryId} />;
}

function MatchDetail({ repositoryId }: { repositoryId: string }) {
  const sessionId = useSessionId();
  const typedId = repositoryId as Id<"repositories">;
  const generateContribution = useAction(api.ai.contribute.generateContribution);
  const enrichRepo = useAction(api.ai.enrich.enrichRepo);
  const ensureSuggested = useMutation(api.contributions.ensureSuggested);
  const markCompleted = useMutation(api.contributions.markCompleted);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = useQuery(
    api.matching.matchRepos,
    sessionId ? { sessionId, limit: 15 } : "skip",
  );
  const contribution = useQuery(
    api.contributions.getForRepo,
    sessionId ? { sessionId, repositoryId: typedId } : "skip",
  );

  const match = matches?.find((item) => item.repositoryId === repositoryId);
  const hasMatch = Boolean(match);

  useEffect(() => {
    if (!sessionId || !hasMatch) {
      return;
    }
    void generateContribution({
      sessionId,
      repositoryId: typedId,
      kind: "first",
    }).catch(() =>
      ensureSuggested({ sessionId, repositoryId: typedId }),
    );
    void enrichRepo({ repositoryId: typedId }).catch(() => {
      // Enrichment is optional until repoDocuments exists.
    });
  }, [
    enrichRepo,
    ensureSuggested,
    generateContribution,
    hasMatch,
    sessionId,
    typedId,
  ]);

  async function complete() {
    if (!sessionId || !contribution) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await markCompleted({ sessionId, contributionId: contribution._id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update");
    } finally {
      setWorking(false);
    }
  }

  if (!sessionId || matches === undefined) {
    return <p className="mt-8 text-slate-400">Loading match…</p>;
  }

  if (!match) {
    return (
      <p className="mt-8 text-slate-400">
        This repo is not in your current match set.{" "}
        <Link href="/matches" className="text-sky-400 hover:text-sky-300">
          Back to matches
        </Link>
      </p>
    );
  }

  const completed = contribution?.status === "completed";
  const hasPlan = Boolean(contribution?.steps && contribution.steps.length > 0);

  return (
    <div className="mt-10 max-w-3xl">
      <p className="text-sm text-sky-400">{match.score}/100 · {match.difficulty}</p>
      <h1 className="mt-3 text-3xl font-bold text-white">{match.fullName}</h1>
      <p className="mt-4 leading-relaxed text-slate-400">{match.description}</p>
      <p className="mt-4 text-slate-300">{match.newcomerNote}</p>
      <ul className="mt-6 space-y-1 text-sm text-slate-400">
        {match.reasons.map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">
          {hasPlan ? contribution?.title : "First contribution"}
        </h2>
        {hasPlan && contribution?.whyThisIssue ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {contribution.whyThisIssue}
          </p>
        ) : null}
        {hasPlan && contribution?.steps ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-300">
            {contribution.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : (
          <PlanWait />
        )}
        {hasPlan && contribution?.issueUrl ? (
          <a
            href={contribution.issueUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            Open suggested issue
          </a>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={match.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400"
          >
            Open on GitHub
          </a>
          <button
            type="button"
            disabled={working || completed || !contribution}
            onClick={() => void complete()}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
          >
            {completed ? "Marked as completed" : working ? "Saving…" : "Mark as completed"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>
    </div>
  );
}
