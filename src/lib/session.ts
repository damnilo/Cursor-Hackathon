"use client";

import { useSyncExternalStore } from "react";

const SESSION_KEY = "firstcontrib.sessionId";
const VISIT_KEY = "firstcontrib.visitId";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function readOrCreate(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing && existing.length >= 8) {
    return existing;
  }
  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  window.localStorage.removeItem(SESSION_KEY);
  return readOrCreate(window.sessionStorage, SESSION_KEY);
}

export function getVisitId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return readOrCreate(window.sessionStorage, VISIT_KEY);
}

export function clearSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  emit();
}

export function useSessionId(): string {
  return useSyncExternalStore(subscribe, getSessionId, () => "");
}

export function useVisitId(): string {
  return useSyncExternalStore(subscribe, getVisitId, () => "");
}
