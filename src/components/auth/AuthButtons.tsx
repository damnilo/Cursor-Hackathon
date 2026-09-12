"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { useSessionId } from "@/lib/session";
import { api } from "../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";

export function AuthButtons() {
  if (!isConvexConfigured()) {
    return null;
  }
  return <AuthControls />;
}

function AuthControls() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const sessionId = useSessionId();
  const linkSession = useMutation(api.profiles.linkSession);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) {
      return;
    }
    void linkSession({ sessionId }).catch(() => {
      // Guest profile stays on sessionId until the next save.
    });
  }, [isAuthenticated, linkSession, sessionId]);

  if (isLoading) {
    return <span className="text-sm text-slate-500">…</span>;
  }

  if (isAuthenticated) {
    return (
      <button
        type="button"
        disabled={working}
        onClick={() => {
          setWorking(true);
          void signOut().finally(() => setWorking(false));
        }}
        className="rounded-sm border border-slate-600 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-slate-200 transition hover:border-slate-400 disabled:opacity-60"
      >
        {working ? "Signing out…" : "Sign out"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={working}
      onClick={() => {
        setWorking(true);
        void signIn("google", { redirectTo: window.location.href }).finally(
          () => setWorking(false),
        );
      }}
        className="inline-flex h-10 items-center rounded-sm bg-sky-500 px-[18px] font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
    >
      {working ? "Opening Google…" : "Sign in with Google"}
    </button>
  );
}
