"use client";

import { useEffect, useState } from "react";

const RANKING_MESSAGES = [
  "Finding your best matches…",
  "Scoring beginner-friendly repositories…",
  "Asking Grok to rank the shortlist…",
  "Picking the clearest first-contribution paths…",
];

const PLAN_MESSAGES = [
  "Generating your first-contribution plan…",
  "Reading the repo guide for newcomers…",
  "Asking Grok for a concrete first issue…",
];

function useCycle(length: number, intervalMs: number) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => current + 1);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return step % length;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="h-3 w-20 rounded bg-slate-700" />
      <div className="mt-4 h-6 w-2/3 rounded bg-slate-700" />
      <div className="mt-3 h-4 w-full rounded bg-slate-800" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-800" />
    </div>
  );
}

export function RankingWait() {
  const messageIndex = useCycle(RANKING_MESSAGES.length, 2600);
  const [cards, setCards] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCards((current) => Math.min(current + 1, 3));
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mt-10 space-y-6">
      <p className="text-sm text-slate-300">{RANKING_MESSAGES[messageIndex]}</p>
      {Array.from({ length: cards }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function PlanWait() {
  const messageIndex = useCycle(PLAN_MESSAGES.length, 2600);

  return (
    <p className="mt-3 text-sm text-slate-400">{PLAN_MESSAGES[messageIndex]}</p>
  );
}
