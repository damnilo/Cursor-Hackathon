"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { WhyMatch } from "@/components/matches/MatchCard";
import { PlanWait } from "@/components/matches/StatusCycle";
import { actionNotice } from "@/lib/actionNotice";
import { useSessionId } from "@/lib/session";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const ensureSuggested = useMutation(api.contributions.ensureSuggested);
  const markCompleted = useMutation(api.contributions.markCompleted);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planSettledFor, setPlanSettledFor] = useState<string | null>(null);
  const [waitingKind, setWaitingKind] = useState<"first" | "next">("first");
  const autoStartedFor = useRef<string | null>(null);

  const matches = useQuery(
    api.matching.matchRepos,
    sessionId ? { sessionId, limit: 15 } : "skip",
  );
  const firstPlan = useQuery(
    api.contributions.getForRepo,
    sessionId
      ? { sessionId, repositoryId: typedId, kind: "first" as const }
      : "skip",
  );
  const nextPlan = useQuery(
    api.contributions.getForRepo,
    sessionId
      ? { sessionId, repositoryId: typedId, kind: "next" as const }
      : "skip",
  );

  const match = matches?.find((item) => item.repositoryId === repositoryId);
  const hasMatch = Boolean(match);

  useEffect(() => {
    if (!sessionId || !hasMatch || firstPlan === undefined) {
      return;
    }
    if (autoStartedFor.current === typedId) {
      return;
    }
    autoStartedFor.current = typedId;

    const hasSteps = Boolean(firstPlan?.steps && firstPlan.steps.length > 0);
    let cancelled = false;
    const settle = () => {
      if (!cancelled) {
        setPlanSettledFor(typedId);
      }
    };
    void generateContribution({
      sessionId,
      repositoryId: typedId,
      kind: "first",
    })
      .catch((caught) => {
        const notice = actionNotice(caught);
        if (notice) {
          setError(notice);
          return undefined;
        }
        if (!hasSteps) {
          return ensureSuggested({ sessionId, repositoryId: typedId });
        }
        return undefined;
      })
      .finally(settle);
    if (hasSteps) {
      return () => {
        cancelled = true;
      };
    }
    const timeout = window.setTimeout(() => {
      settle();
    }, 22_000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    firstPlan,
    ensureSuggested,
    generateContribution,
    hasMatch,
    sessionId,
    typedId,
  ]);

  async function complete() {
    if (!sessionId || !firstPlan) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await markCompleted({ sessionId, contributionId: firstPlan._id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update");
    } finally {
      setWorking(false);
    }
  }

  async function refreshPlan() {
    if (!sessionId) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await generateContribution({
        sessionId,
        repositoryId: typedId,
        kind: "first",
        force: true,
      });
    } catch (caught) {
      setError(
        actionNotice(caught) ??
          (caught instanceof Error ? caught.message : "Could not refresh the plan"),
      );
    } finally {
      setWorking(false);
    }
  }

  async function requestNext() {
    if (!sessionId) {
      return;
    }
    setWorking(true);
    setError(null);
    setWaitingKind("next");
    setPlanSettledFor(null);
    try {
      await generateContribution({
        sessionId,
        repositoryId: typedId,
        kind: "next",
      });
    } catch (caught) {
      setError(
        actionNotice(caught) ??
          (caught instanceof Error
            ? caught.message
            : "Could not generate the next plan"),
      );
      await ensureSuggested({
        sessionId,
        repositoryId: typedId,
        kind: "next",
      });
    } finally {
      setPlanSettledFor(typedId);
      setWorking(false);
    }
  }

  if (!sessionId || matches === undefined || firstPlan === undefined || nextPlan === undefined) {
    return <p className="mt-8 text-slate-400">Loading match…</p>;
  }

  if (!match) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <p className="text-slate-200">This repo is not in your current matches.</p>
        <p className="mt-2 text-sm text-slate-400">
          Ranked lists can change after you edit the profile. Open your matches
          and pick one of the cards there.
        </p>
        <Link
          href="/matches"
          className="mt-4 inline-flex rounded-sm bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Back to matches
        </Link>
      </div>
    );
  }

  const completed = firstPlan?.status === "completed";
  const hasPlan = Boolean(firstPlan?.steps && firstPlan.steps.length > 0);
  const hasNextPlan = Boolean(nextPlan?.steps && nextPlan.steps.length > 0);
  const waitingForPlan = planSettledFor !== typedId && !hasPlan;
  const waitingForNext = working && waitingKind === "next" && !hasNextPlan;

  return (
    <div className="mt-10 max-w-3xl">
      <p className="text-sm text-sky-400">
        {match.score}/100 · {match.difficulty}
        {completed ? " · Completed" : ""}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white">{match.fullName}</h1>
      <p className="mt-4 leading-relaxed text-slate-400">{match.description}</p>
      {match.newcomerNote.trim().toLowerCase() !==
      match.description.trim().toLowerCase() ? (
        <p className="mt-4 text-slate-300">{match.newcomerNote}</p>
      ) : null}
      <WhyMatch reasons={match.reasons} />

      {waitingForPlan ? (
        <PlanWait kind={waitingKind} />
      ) : hasPlan && firstPlan ? (
      <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">
          {firstPlan.title}
        </h2>
        {firstPlan.whyThisIssue ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {firstPlan.whyThisIssue}
          </p>
        ) : null}
        {firstPlan.timeEstimate || (firstPlan.skills && firstPlan.skills.length > 0) ? (
          <p className="mt-3 text-sm text-slate-400">
            {firstPlan.timeEstimate ? `${firstPlan.timeEstimate}` : ""}
            {firstPlan.timeEstimate && firstPlan.skills && firstPlan.skills.length > 0
              ? " · "
              : ""}
            {firstPlan.skills && firstPlan.skills.length > 0
              ? firstPlan.skills.join(", ")
              : ""}
          </p>
        ) : null}
        {firstPlan.steps ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-300">
            {firstPlan.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
        {firstPlan.issueUrl ? (
          <a
            href={firstPlan.issueUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            Open suggested issue
          </a>
        ) : null}
        {hasNextPlan && nextPlan ? (
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-lg font-semibold text-white">{nextPlan.title}</h3>
            {nextPlan.whyThisIssue ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {nextPlan.whyThisIssue}
              </p>
            ) : null}
            {nextPlan.steps ? (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                {nextPlan.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
            {nextPlan.issueUrl ? (
              <a
                href={nextPlan.issueUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm text-sky-400 hover:text-sky-300"
              >
                Open the next issue
              </a>
            ) : null}
          </div>
        ) : null}
        {waitingForNext ? <PlanWait kind="next" /> : null}
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
            disabled={working}
            onClick={() => void refreshPlan()}
            className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400 disabled:opacity-60"
          >
            {working ? "Preparing…" : "Refresh plan"}
          </button>
          {completed ? (
            <button
              type="button"
              disabled={working}
              onClick={() => void requestNext()}
              className="rounded-sm bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
            >
              {working
                ? "Preparing…"
                : hasNextPlan
                  ? "Refresh next plan"
                  : "Get next contribution"}
            </button>
          ) : (
            <button
              type="button"
              disabled={working || !firstPlan}
              onClick={() => void complete()}
              className="rounded-sm bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
            >
              {working ? "Saving…" : "Mark as completed"}
            </button>
          )}
        </div>
        {completed ? (
          <p className="mt-3 text-sm text-emerald-300">
            {hasNextPlan
              ? "The first plan stays completed. The next plan is below."
              : "Marked as completed. Ask for the next plan when you are ready."}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>
      ) : (
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-slate-200">Could not generate a plan yet.</p>
          <p className="mt-2 text-sm text-slate-400">
            The repository is still a match — open it on GitHub, or go back and
            try another card.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={match.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Open the repository on GitHub
            </a>
            <Link
              href="/matches"
              className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400"
            >
              Back to matches
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
