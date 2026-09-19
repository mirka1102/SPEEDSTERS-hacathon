"use client";

import { useEffect, useState } from "react";
import type { Answers, ExplainResponse, Plan, Program } from "@shared/types";
import { buildMockPlan } from "./mockEngine";
import { getExplainFromApi, getPlanFromApi, getProgramsFromApi } from "./api";
import programsData from "../mock/programs.json";

const mockPrograms = programsData as Program[];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface PlanState {
  plan: Plan;
  loading: boolean;
  /** Set when a real backend call failed; `plan` still holds a usable (mock) fallback so no
   * screen ever renders blank (SPEC.md §9 / jury script step 7). */
  error: string | null;
}

interface ProgramsState {
  programs: Program[];
  loading: boolean;
  error: string | null;
}

interface ApiPlanResult {
  plan: Plan | null;
  loading: boolean;
  error: string | null;
}

interface ApiProgramsResult {
  programs: Program[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Real backend when `NEXT_PUBLIC_API_BASE_URL` is set, mock engine otherwise — the one seam
 * every screen (Diagnosis, Recommendations, Compare, Roadmap, Favorites, ProgramDetail) reads
 * through. `buildMockPlan` is a pure, synchronous, in-memory computation, so the mock path never
 * touches an effect and resolves in the same render — existing render-and-assert tests keep
 * working unchanged.
 */
export function usePlan(answers: Answers, selected?: string[]): PlanState {
  const selectedKey = selected?.join(",") ?? "";
  const [apiState, setApiState] = useState<ApiPlanResult>({
    plan: null,
    loading: Boolean(API_BASE_URL),
    error: null,
  });

  useEffect(() => {
    if (!API_BASE_URL) return;
    let cancelled = false;
    getPlanFromApi(answers, selected)
      .then((plan) => {
        if (!cancelled) setApiState({ plan, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setApiState({
          plan: null,
          loading: false,
          error: err instanceof Error ? err.message : "Не удалось получить данные с сервера",
        });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(answers), selectedKey]);

  if (!API_BASE_URL) {
    return { plan: buildMockPlan(answers, mockPrograms, selected), loading: false, error: null };
  }
  return {
    plan: apiState.plan ?? buildMockPlan(answers, mockPrograms, selected),
    loading: apiState.loading,
    error: apiState.error,
  };
}

export function usePrograms(): ProgramsState {
  const [apiState, setApiState] = useState<ApiProgramsResult>({
    programs: null,
    loading: Boolean(API_BASE_URL),
    error: null,
  });

  useEffect(() => {
    if (!API_BASE_URL) return;
    let cancelled = false;
    getProgramsFromApi()
      .then((programs) => {
        if (!cancelled) setApiState({ programs, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setApiState({
          programs: null,
          loading: false,
          error: err instanceof Error ? err.message : "Не удалось получить данные с сервера",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!API_BASE_URL) {
    return { programs: mockPrograms, loading: false, error: null };
  }
  return {
    programs: apiState.programs ?? mockPrograms,
    loading: apiState.loading,
    error: apiState.error,
  };
}

interface ExplanationState {
  /** null until a real LLM response lands — every call site falls back to its own local
   * template text (lib/diagnosisText.ts / lib/whyText.ts) while this is null, so nothing ever
   * waits on or breaks over the LLM path (SPEC.md §6 / jury script step 7). */
  diagnosisText: string | null;
  whyText: Record<string, string>;
}

/**
 * Real LLM phrasing (POST /api/explain) layered on top of the engine's own facts. Only attempted
 * when `NEXT_PUBLIC_API_BASE_URL` is set — in mock mode this is a no-op and every screen just
 * keeps using its local template text, same as before this hook existed.
 */
export function useExplanation(plan: Plan): ExplanationState {
  const [state, setState] = useState<ExplanationState>({ diagnosisText: null, whyText: {} });
  const planKey = JSON.stringify({
    ids: plan.recommendations.map((r) => r.program.id),
    stats: plan.diagnosis.stats,
  });

  useEffect(() => {
    if (!API_BASE_URL) return;
    let cancelled = false;
    getExplainFromApi(plan, "ru")
      .then((res: ExplainResponse) => {
        if (!cancelled) setState({ diagnosisText: res.diagnosisText, whyText: res.whyText });
      })
      .catch(() => {
        if (!cancelled) setState({ diagnosisText: null, whyText: {} });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  return state;
}
