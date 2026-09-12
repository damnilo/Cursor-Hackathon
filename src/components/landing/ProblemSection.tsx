const problems = [
  {
    index: "01",
    title: "Too many repos, zero direction",
    description:
      "GitHub has millions of projects. Students do not know which ones actually welcome first-time contributors.",
  },
  {
    index: "02",
    title: "Hidden contribution barriers",
    description:
      "Missing CONTRIBUTING guides, unclear issue labels, and intimidating codebases stop people before they start.",
  },
  {
    index: "03",
    title: "No personalized path",
    description:
      "Your skills, time, and interests matter, but most lists treat every student the same.",
  },
];

export function ProblemSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/40 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:gap-20">
        <div className="max-w-sm shrink-0">
          <h2 className="font-serif text-4xl leading-[1.15] text-slate-100 sm:text-5xl">
            Why the first contribution is hard
          </h2>
          <p className="mt-4 leading-[1.65] text-slate-400">
            Every developer remembers staring at GitHub, not knowing where to begin.
          </p>
        </div>
        <div className="flex flex-1 flex-col divide-y divide-slate-800">
          {problems.map((item) => (
            <article key={item.title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
              <span className="w-10 shrink-0 font-mono text-sm text-sky-400">
                {item.index}
              </span>
              <div>
                <h3 className="font-serif text-2xl text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-[1.65] text-slate-400">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
