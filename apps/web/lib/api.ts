import type { Answers, Plan } from "@shared/types";
import { buildMockPlan } from "./mockEngine";
import programsData from "../mock/programs.json";
import type { Program } from "@shared/types";

const programs = programsData as Program[];

// Mock-only for now — swapping to the real backend later means changing only this function's
// body (a fetch to POST /api/plan), not any caller.
export function getPlan(answers: Answers): Plan {
  return buildMockPlan(answers, programs);
}

export function getPrograms(): Program[] {
  return programs;
}
