import Link from "next/link";

export function WhyMatch({ reasons }: { reasons: string[] }) {
  const aiReason = reasons.find((reason) => reason.startsWith("AI: "));
  const rest = reasons.filter((reason) => !reason.startsWith("AI: "));
  const lead = aiReason ? aiReason.slice(4).trim() : null;

  if (!lead && rest.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Why this match
      </p>
      {lead ? <p className="mt-2 text-sm text-slate-300">{lead}</p> : null}
      {rest.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-400">
          {rest.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type MatchCardProps = {
  rank: number;
  repositoryId: string;
  fullName: string;
  url: string;
  description: string;
  primaryLanguage: string;
  difficulty: string;
  stars: number;
  score: number;
  reasons: string[];
  newcomerNote: string;
  completed?: boolean;
};

export function MatchCard({
  rank,
  repositoryId,
  fullName,
  url,
  description,
  primaryLanguage,
  difficulty,
  stars,
  score,
  reasons,
  newcomerNote,
  completed = false,
}: MatchCardProps) {
  const extraNote =
    newcomerNote.trim().toLowerCase() !== description.trim().toLowerCase()
      ? newcomerNote
      : null;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-400">
              Match {rank}
            </p>
            {completed ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Completed
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">
            <Link href={`/matches/${repositoryId}`} className="hover:text-sky-300">
              {fullName}
            </Link>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
        </div>
        <p className="rounded-full bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-300">
          {score}/100
        </p>
      </div>
      {extraNote ? (
        <p className="mt-4 text-sm text-slate-300">{extraNote}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-slate-700 px-2 py-1">{primaryLanguage}</span>
        <span className="rounded-full border border-slate-700 px-2 py-1">{difficulty}</span>
        <span className="rounded-full border border-slate-700 px-2 py-1">
          {stars.toLocaleString()} stars
        </span>
      </div>
      <WhyMatch reasons={reasons} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/matches/${repositoryId}`}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Open plan
        </Link>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-400 hover:text-white"
        >
          GitHub
        </a>
      </div>
    </article>
  );
}
