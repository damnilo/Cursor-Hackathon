"use client";

import { ChipGroup } from "@/components/profile/ChipGroup";
import {
  LANGUAGE_OPTIONS,
  STACK_OPTIONS,
  TOPIC_OPTIONS,
} from "@/lib/catalogs";
import { clearSessionId, getSessionId, useSessionId, useVisitId } from "@/lib/session";
import type { Difficulty, StudentProfile } from "@/lib/matching";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const emptyProfile: StudentProfile = {
  languages: [],
  stack: [],
  topics: [],
  level: "beginner",
  wantGoodFirstIssue: true,
};

function isUnauthorized(caught: unknown): boolean {
  return caught instanceof Error && caught.message.includes("Unauthorized");
}

/** A sessionId already linked to Google cannot start a new guest row. Mint a fresh one and retry once. */
async function writableSession(
  sessionId: string,
  write: (sessionId: string) => Promise<void>,
): Promise<string> {
  try {
    await write(sessionId);
    return sessionId;
  } catch (caught) {
    if (!isUnauthorized(caught)) {
      throw caught;
    }
    clearSessionId();
    const next = getSessionId();
    await write(next);
    return next;
  }
}

export function ProfileForm() {
  const router = useRouter();
  const sessionId = useSessionId();
  const visitId = useVisitId();
  const [draft, setDraft] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const seed = useMutation(api.seed.seedRepositories);
  const upsert = useMutation(api.profiles.upsert);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const saveCv = useMutation(api.profiles.saveCv);
  const parseCv = useAction(api.ai.parseCv.parseCv);
  const [uploadedCvName, setUploadedCvName] = useState<string | null>(null);
  const [cvWorking, setCvWorking] = useState(false);
  const saved = useQuery(
    api.profiles.getBySession,
    sessionId && visitId ? { sessionId, visitId } : "skip",
  );
  const cvName = uploadedCvName ?? saved?.cvFileName ?? null;

  const profile =
    draft ??
    (saved
      ? {
          languages: saved.languages,
          stack: saved.stack,
          topics: saved.topics,
          level: saved.level,
          wantGoodFirstIssue: saved.wantGoodFirstIssue,
        }
      : emptyProfile);

  useEffect(() => {
    void seed({}).catch(() => {
      // Seed is best-effort; matching page will retry.
    });
  }, [seed]);

  async function onCvSelected(file: File | undefined) {
    if (!file || !sessionId) {
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Upload a PDF for now.");
      return;
    }
    setCvWorking(true);
    setError(null);
    try {
      let uploadUrl = "";
      const cvSession = await writableSession(sessionId, async (id) => {
        uploadUrl = await generateUploadUrl({ sessionId: id });
      });
      const uploaded = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });
      if (!uploaded.ok) {
        throw new Error("Could not upload the CV");
      }
      const payload = (await uploaded.json()) as { storageId?: string };
      if (typeof payload.storageId !== "string") {
        throw new Error("Upload did not return a file id");
      }
      const savedSession = await writableSession(cvSession, async (id) => {
        await saveCv({
          sessionId: id,
          storageId: payload.storageId as Id<"_storage">,
          fileName: file.name,
        });
      });
      setUploadedCvName(file.name);
      const parsed = await parseCv({ sessionId: savedSession });
      const filled =
        parsed.languages.length > 0 ||
        parsed.stack.length > 0 ||
        parsed.topics.length > 0;
      if (filled && !parsed.error) {
        setDraft({
          languages: parsed.languages,
          stack: parsed.stack,
          topics: parsed.topics,
          level: parsed.level,
          wantGoodFirstIssue: parsed.wantGoodFirstIssue,
        });
        if (parsed.languages.length === 0) {
          setError(
            "CV is saved. Pick at least one language. Stack and topics from the CV are filled in.",
          );
        }
      } else if (parsed.error) {
        setError(parsed.error);
      } else {
        setError(
          "CV is saved. Chip fill from Grok is not ready yet — pick languages manually.",
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read the CV");
    } finally {
      setCvWorking(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (profile.languages.length === 0) {
      setError("Pick at least one language so we can filter repos.");
      return;
    }

    setSaving(true);
    try {
      const savedSession = await writableSession(sessionId, async (id) => {
        await upsert({
          sessionId: id,
          visitId,
          ...profile,
        });
      });
      if (!savedSession) {
        throw new Error("Could not save profile");
      }
      router.push("/matches");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <p className="text-sm font-medium text-white">CV (optional)</p>
        <p className="mt-1 text-sm text-slate-400">
          PDF only. We try to prefill languages, stack, and topics — you can
          still edit every chip.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          The PDF is read in the app. A text excerpt is sent to the model to
          suggest chips.
        </p>
        <label className="mt-4 inline-flex cursor-pointer rounded-sm border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-400">
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={cvWorking || !sessionId}
            onChange={(event) => {
              const file = event.target.files?.[0];
              void onCvSelected(file);
              event.target.value = "";
            }}
          />
          {cvWorking ? "Reading CV…" : "Upload PDF"}
        </label>
        {cvName ? (
          <p className="mt-3 text-sm text-slate-400">Saved: {cvName}</p>
        ) : null}
      </div>

      <ChipGroup
        label="Languages"
        hint="Required — we only keep repos that share at least one."
        options={LANGUAGE_OPTIONS}
        selected={profile.languages}
        onChange={(languages) => setDraft({ ...profile, languages })}
      />

      <ChipGroup
        label="Stack"
        hint="Optional frameworks and tools you already know."
        options={STACK_OPTIONS}
        selected={profile.stack}
        onChange={(stack) => setDraft({ ...profile, stack })}
      />

      <ChipGroup
        label="Topics"
        hint="What you want to learn or contribute to."
        options={TOPIC_OPTIONS}
        selected={profile.topics}
        onChange={(topics) => setDraft({ ...profile, topics })}
      />

      <fieldset>
        <legend className="text-sm font-medium text-white">Experience</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {(["beginner", "intermediate"] as const).map((level) => (
            <label
              key={level}
              className={
                profile.level === level
                  ? "flex cursor-pointer items-center gap-2 rounded-sm bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950"
                  : "flex cursor-pointer items-center gap-2 rounded-sm border border-slate-700 px-4 py-2 text-sm text-slate-300"
              }
            >
              <input
                type="radio"
                name="level"
                value={level}
                checked={profile.level === level}
                onChange={() =>
                  setDraft({
                    ...profile,
                    level: level as Difficulty,
                  })
                }
                className="sr-only"
              />
              {level === "beginner" ? "Beginner" : "Intermediate"}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={profile.wantGoodFirstIssue}
          onChange={(event) =>
            setDraft({
              ...profile,
              wantGoodFirstIssue: event.target.checked,
            })
          }
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500"
        />
        Only show repositories with good first issues
      </label>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={saving || !sessionId}
        className="rounded-sm bg-sky-500 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
      >
        {saving ? "Matching…" : "Find my repos"}
      </button>
    </form>
  );
}
