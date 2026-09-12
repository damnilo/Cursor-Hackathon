const steps = [
  {
    step: "01",
    title: "Tell us about you",
    description:
      "Skills, languages, experience level, and how much time you can commit each week.",
  },
  {
    step: "02",
    title: "Deterministic matching",
    description:
      "We filter and score 40+ curated repos against your profile — transparent, repeatable rules.",
  },
  {
    step: "03",
    title: "AI-guided first PR",
    description:
      "Grok ranks your top matches and suggests a concrete first contribution path.",
  },
];

export function SolutionSection() {
  return (
    <section id="how-it-works" className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
          How FirstContrib works
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
          Three phases: match with the right project, then get guided to your
          first pull request.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((item) => (
            <article key={item.step} className="relative">
              <span className="text-5xl font-bold text-slate-800">{item.step}</span>
              <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
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
