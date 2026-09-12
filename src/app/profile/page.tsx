import { AppShell } from "@/components/AppShell";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";

export default function ProfilePage() {
  return (
    <AppShell>
      <p className="text-sm font-medium text-sky-400">Step 1 of 3</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Student profile</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
        Sign in with Google if you want a saved profile, or continue as a guest.
        Upload a PDF CV to prefill chips, then edit them before we match.
      </p>
      <ProfilePageClient />
    </AppShell>
  );
}
