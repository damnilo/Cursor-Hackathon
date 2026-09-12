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
      "We score 50+ curated beginner-friendly repos against your profile, then Grok picks the clearest 3 to 5.",
  },
  {
    step: "03",
    title: "Open a first-PR plan",
    description:
      "Each match comes with a concrete issue, steps, and a way to mark it complete. Then ask for the next one.",
  },
];

export function SolutionSection() {
  return (
    <section id="how-it-works" className="px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl font-serif text-4xl leading-[1.15] text-slate-100 sm:text-5xl">
          How FirstContrib works
        </h2>
        <p className="mt-4 max-w-[520px] leading-[1.65] text-slate-400">
          Profile, ranked matches, then a concrete first pull request — not a
          wall of repositories.
        </p>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((item) => (
            <article key={item.step} className="flex flex-col gap-3">
              <span className="font-serif text-6xl leading-none text-sky-500/80">
                {item.step}
              </span>
              <h3 className="font-serif text-2xl text-slate-100">{item.title}</h3>
              <p className="text-sm leading-[1.65] text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
