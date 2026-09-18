"use client";
import { useCallback, useEffect, useState } from "react";
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
  answers: Answers;
  selectedPrograms: string[];
  favorites: string[];
  progress: Record<string, string>;
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return { answers: DEFAULT_ANSWERS, selectedPrograms: [], favorites: [], progress: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { answers: DEFAULT_ANSWERS, selectedPrograms: [], favorites: [], progress: {} };
    const parsed = JSON.parse(raw);
    return {
      answers: { ...DEFAULT_ANSWERS, ...parsed.answers },
      selectedPrograms: parsed.selectedPrograms ?? [],
      favorites: parsed.favorites ?? [],
      progress: parsed.progress ?? {},
    };
  } catch {
    return { answers: DEFAULT_ANSWERS, selectedPrograms: [], favorites: [], progress: {} };
  }
}

export function useProfileStore() {
  const [state, setState] = useState<StoredState>({
    answers: DEFAULT_ANSWERS,
    selectedPrograms: [],
    favorites: [],
    progress: {},
  });

  useEffect(() => {
    // Intentional SSR hydration: server render uses DEFAULT_ANSWERS, then this syncs from
    // localStorage once mounted (localStorage is unavailable during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
  }, []);

  const persist = useCallback((next: StoredState) => {
    setState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const setAnswers = useCallback(
    (partial: Partial<Answers>) => {
      persist({ ...state, answers: { ...state.answers, ...partial } });
    },
    [state, persist],
  );

  const setSelectedPrograms = useCallback(
    (ids: string[]) => persist({ ...state, selectedPrograms: ids }),
    [state, persist],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const has = state.favorites.includes(id);
      persist({
        ...state,
        favorites: has ? state.favorites.filter((f) => f !== id) : [...state.favorites, id],
      });
    },
    [state, persist],
  );

  const toggleTaskDone = useCallback(
    (taskId: string) => {
      const next = { ...state.progress };
      if (next[taskId]) delete next[taskId];
      else next[taskId] = new Date().toISOString();
      persist({ ...state, progress: next });
    },
    [state, persist],
  );

  return {
    answers: state.answers,
    setAnswers,
    selectedPrograms: state.selectedPrograms,
    setSelectedPrograms,
    favorites: state.favorites,
    toggleFavorite,
    progress: state.progress,
    toggleTaskDone,
  };
}
