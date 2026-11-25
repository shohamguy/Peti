"use client";

import { useSyncExternalStore } from "react";
import { jobs as seedJobs, type Job } from "./jobs";

/** מצב שנשמר במכשיר (localStorage) — עד שיהיה שרת ובסיס נתונים */
export type Application = { jobId: string; appliedAt: string; note?: string };
export type Profile = { name: string; phone: string; email: string; city: string; category: string };

type State = {
  saved: string[];
  applications: Application[];
  postedJobs: Job[];
  profile: Profile;
};

const KEY = "peti-state-v1";
const emptyProfile: Profile = { name: "", phone: "", email: "", city: "", category: "" };
const initial: State = { saved: [], applications: [], postedJobs: [], profile: emptyProfile };

let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {
    /* אחסון לא זמין — נמשיך בזיכרון בלבד */
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore(): State & { ready: boolean } {
  const s = useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => initial,
  );
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return { ...s, ready };
}

export function allJobs(s: State) {
  return [...s.postedJobs, ...seedJobs];
}

export const actions = {
  toggleSave(id: string) {
    set({ saved: state.saved.includes(id) ? state.saved.filter((x) => x !== id) : [id, ...state.saved] });
  },
  apply(jobId: string, note?: string) {
    if (state.applications.some((a) => a.jobId === jobId)) return;
    set({ applications: [{ jobId, note, appliedAt: new Date().toISOString() }, ...state.applications] });
  },
  postJob(job: Omit<Job, "id" | "postedAt" | "local">) {
    const id = `my-${Date.now().toString(36)}`;
    set({ postedJobs: [{ ...job, id, postedAt: new Date().toISOString(), local: true }, ...state.postedJobs] });
    return id;
  },
  deleteJob(id: string) {
    set({ postedJobs: state.postedJobs.filter((j) => j.id !== id) });
  },
  saveProfile(profile: Profile) {
    set({ profile });
  },
};
