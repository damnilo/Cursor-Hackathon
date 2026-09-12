import { CtaSection } from "@/components/landing/CtaSection";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SolutionSection } from "@/components/landing/SolutionSection";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
