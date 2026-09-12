"use client";

import { useSyncExternalStore } from "react";

const SESSION_KEY = "firstcontrib.sessionId";

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing && existing.length >= 8) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function useSessionId(): string {
  return useSyncExternalStore(
    () => () => undefined,
    getSessionId,
    () => "",
  );
}
