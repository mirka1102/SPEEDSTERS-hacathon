"use client";
import { useCallback, useSyncExternalStore } from "react";
import type { Answers } from "@shared/types";

const STORAGE_KEY = "steer.profile.v1";

export const DEFAULT_ANSWERS: Answers = {
  grade: "11",
  intake: "Fall 2027",
  fields: ["cs"],
  interests: [],
  gpa: 4.2,
  achievements: "none",
  ielts: null,
  toefl: null,
  sat: null,
  englishSelf: "B2",
  otherLanguages: [],
  countries: ["open_to_any"],
  studyLanguage: "english_only",
  budgetUsdYear: "15-30k",
  scholarshipNeed: "preferred",
  activities: ["none"],
  hoursPerWeek: 5,
};

interface StoredState {
  /** SPEC.md §4: kept in localStorage, used to build the `/p/[id]` returning-user link. */
  profileId: string;
  answers: Answers;
  selectedPrograms: string[];
  favorites: string[];
  progress: Record<string, string>;
}

// A module-level external store, not component state: the ProfileDrawer (mounted in AppShell)
// and the page behind it (Diagnosis/Recommendations/Compare/Roadmap) each call useProfileStore()
// as siblings in the tree. Two independent `useState`s would only sync through localStorage on
// mount, so editing budget in the drawer would update its own copy and never re-render the page
// showing it — exactly the "edit from any screen and watch it react" feature this store exists
// for. useSyncExternalStore is what keeps every mounted instance reading the same live snapshot.

const SERVER_SNAPSHOT: StoredState = {
  profileId: "",
  answers: DEFAULT_ANSWERS,
  selectedPrograms: [],
  favorites: [],
  progress: {},
};

// null until the first client subscriber hydrates it from localStorage; comparing the snapshot
// returned to callers against SERVER_SNAPSHOT by reference is how `hydrated` below is derived,
// with no separate flag to keep in sync.
let clientSnapshot: StoredState | null = null;
const listeners = new Set<() => void>();

function loadFromLocalStorage(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const next: StoredState = {
      profileId: parsed.profileId ?? crypto.randomUUID(),
      answers: { ...DEFAULT_ANSWERS, ...parsed.answers },
      selectedPrograms: parsed.selectedPrograms ?? [],
      favorites: parsed.favorites ?? [],
      progress: parsed.progress ?? {},
    };
    // A freshly generated id must be written back immediately — otherwise the very next reload
    // (or the copy-link button, moments later) would each mint a different one.
    if (parsed.profileId == null) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  } catch {
    return { ...SERVER_SNAPSHOT, profileId: crypto.randomUUID() };
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (clientSnapshot === null) {
    clientSnapshot = loadFromLocalStorage();
    emit();
  }
  return () => listeners.delete(listener);
}

function getSnapshot(): StoredState {
  return clientSnapshot ?? SERVER_SNAPSHOT;
}

function getServerSnapshot(): StoredState {
  return SERVER_SNAPSHOT;
}

function persist(next: StoredState) {
  clientSnapshot = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

/**
 * Test-only escape hatch: clears the in-memory snapshot so the next subscriber re-hydrates
 * from localStorage. Without this, the module-level store would leak state between `it()`
 * blocks in the same test file even after `localStorage.clear()`, since `subscribe` only
 * re-reads localStorage while `clientSnapshot` is still null.
 */
export function __resetProfileStoreForTests() {
  clientSnapshot = null;
  listeners.clear();
}

export function useProfileStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = state !== SERVER_SNAPSHOT;

  const setAnswers = useCallback((partial: Partial<Answers>) => {
    const current = getSnapshot();
    persist({ ...current, answers: { ...current.answers, ...partial } });
  }, []);

  const setSelectedPrograms = useCallback((ids: string[]) => {
    persist({ ...getSnapshot(), selectedPrograms: ids });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const current = getSnapshot();
    const has = current.favorites.includes(id);
    persist({
      ...current,
      favorites: has ? current.favorites.filter((f) => f !== id) : [...current.favorites, id],
    });
  }, []);

  const toggleTaskDone = useCallback((taskId: string) => {
    const current = getSnapshot();
    const next = { ...current.progress };
    if (next[taskId]) delete next[taskId];
    else next[taskId] = new Date().toISOString();
    persist({ ...current, progress: next });
  }, []);

  return {
    profileId: state.profileId,
    answers: state.answers,
    setAnswers,
    selectedPrograms: state.selectedPrograms,
    setSelectedPrograms,
    favorites: state.favorites,
    toggleFavorite,
    progress: state.progress,
    toggleTaskDone,
    hydrated,
  };
}
