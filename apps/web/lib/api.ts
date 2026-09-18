import type { Answers, Plan, Program } from "@shared/types";
import { buildMockPlan } from "./mockEngine";
import programsData from "../mock/programs.json";

const programs = programsData as Program[];

// Every screen (Diagnosis, Recommendations, Compare, Roadmap, Favorites, ProgramDetail) calls
// getPlan/getPrograms synchronously in render, matching the mock engine's synchronous,
// always-succeeding nature — there's nothing to await and nothing that fails. Swapping these to
// the real backend means every one of those callers needs a loading and error state, since a
// real fetch is async and can fail over the network. That's a real refactor, not a one-line
// change here, and isn't worth doing blind against a backend with no verified, reachable
// Supabase project yet. `getPlanFromApi`/`getProgramsFromApi` below are that real path, ready to
// wire into a caller once there's something real to test against.
export function getPlan(answers: Answers, selected?: string[]): Plan {
  return buildMockPlan(answers, programs, selected);
}

export function getPrograms(): Program[] {
  return programs;
}

function requireApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Point it at a running apps/api instance (with a real " +
        "Supabase project behind it) before calling the *FromApi functions.",
    );
  }
  return baseUrl;
}

/** Real POST /api/plan (SPEC.md §7) — same request/response shape as getPlan's mock. */
export async function getPlanFromApi(answers: Answers, selected?: string[]): Promise<Plan> {
  const res = await fetch(`${requireApiBaseUrl()}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, selected }),
  });
  if (!res.ok) throw new Error(`POST /api/plan failed: ${res.status}`);
  return res.json();
}

/** Real GET /api/programs (SPEC.md §7) — same shape as getPrograms' mock. */
export async function getProgramsFromApi(): Promise<Program[]> {
  const res = await fetch(`${requireApiBaseUrl()}/api/programs`);
  if (!res.ok) throw new Error(`GET /api/programs failed: ${res.status}`);
  return res.json();
}
