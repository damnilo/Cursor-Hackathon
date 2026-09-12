const problems = [
  {
    title: "Too many repos, zero direction",
    description:
      "GitHub has millions of projects. Students don't know which ones actually welcome first-time contributors.",
  },
  {
    title: "Hidden contribution barriers",
    description:
      "Missing CONTRIBUTING guides, unclear issue labels, and intimidating codebases stop people before they start.",
  },
  {
    title: "No personalized path",
    description:
      "Your skills, time, and interests matter — but most lists treat every student the same.",
  },
];

export function ProblemSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/50 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
          Why the first contribution is hard
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
          Every developer remembers staring at GitHub, not knowing where to begin.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {problems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
