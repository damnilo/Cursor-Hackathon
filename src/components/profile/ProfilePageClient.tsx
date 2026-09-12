"use client";

import { isConvexConfigured } from "@/app/ConvexClientProvider";
import { ProfileForm } from "@/components/profile/ProfileForm";

export function ProfilePageClient() {
  if (!isConvexConfigured()) {
    return (
      <p className="mt-8 text-slate-400">
        Set NEXT_PUBLIC_CONVEX_URL and run `npx convex dev` to save a profile.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <ProfileForm />
    </div>
  );
}
