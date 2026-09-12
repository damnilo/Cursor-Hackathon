const steps = [
  {
    step: "01",
    title: "Tell us about you",
    description:
      "Languages, stack, topics, experience level, and whether you want a good first issue.",
  },
  {
    step: "02",
    title: "Get ranked matches",
    description:
      "We score 40+ curated beginner-friendly repos against your profile, then Grok picks the clearest 3–5.",
  },
  {
    step: "03",
    title: "Open a first-PR plan",
    description:
      "Each match comes with a concrete issue, steps, and a way to mark it complete — then ask for the next one.",
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
          Profile, ranked matches, then a concrete first pull request — not a
          wall of repositories.
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
