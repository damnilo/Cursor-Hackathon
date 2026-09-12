type MatchCardProps = {
  rank: number;
  fullName: string;
  url: string;
  description: string;
  primaryLanguage: string;
  difficulty: string;
  stars: number;
  score: number;
  reasons: string[];
  newcomerNote: string;
};

export function MatchCard({
  rank,
  fullName,
  url,
  description,
  primaryLanguage,
  difficulty,
  stars,
  score,
  reasons,
  newcomerNote,
}: MatchCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-400">
            Match {rank}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            <a href={url} target="_blank" rel="noreferrer" className="hover:text-sky-300">
              {fullName}
            </a>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
        </div>
        <p className="rounded-full bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-300">
          {score}/100
        </p>
      </div>
      <p className="mt-4 text-sm text-slate-300">{newcomerNote}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-slate-700 px-2 py-1">{primaryLanguage}</span>
        <span className="rounded-full border border-slate-700 px-2 py-1">{difficulty}</span>
        <span className="rounded-full border border-slate-700 px-2 py-1">
          {stars.toLocaleString()} stars
        </span>
      </div>
      <ul className="mt-4 space-y-1 text-sm text-slate-400">
        {reasons.map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </article>
  );
}
