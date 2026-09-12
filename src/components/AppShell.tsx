import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16 pt-4 sm:px-10">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
