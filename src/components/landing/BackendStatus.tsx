"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isConvexConfigured } from "@/app/ConvexClientProvider";

export function BackendStatus() {
  if (!isConvexConfigured()) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-200">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        Set NEXT_PUBLIC_CONVEX_URL (run npx convex dev)
      </div>
    );
  }

  return <ConnectedStatus />;
}

function ConnectedStatus() {
  const ping = useQuery(api.health.ping);

  if (ping === undefined) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        Connecting to backend…
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-200">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      Backend connected
    </div>
  );
}
