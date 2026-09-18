import { describe, it, expect } from "vitest";
import { buildMockPlan } from "./mockEngine";
import programs from "../mock/programs.json";
import type { Answers, Program } from "@shared/types";

const typedPrograms = programs as Program[];

function baseAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    grade: "11",
    intake: "Fall 2027",
    fields: ["cs"],
    interests: [],
    gpa: 4.5,
    achievements: "none",
    ielts: { value: 7.0 },
    toefl: null,
    sat: { value: 1500 },
    englishSelf: null,
    otherLanguages: [],
    countries: ["US", "UK", "DE", "KR", "TR"],
    studyLanguage: "english_only",
    budgetUsdYear: "50k+",
    scholarshipNeed: "not_needed",
    activities: ["projects"],
    hoursPerWeek: 10,
    ...overrides,
  };
}

describe("buildMockPlan", () => {
  it("returns at least 3 recommendations sorted by fit score descending", () => {
    const plan = buildMockPlan(baseAnswers(), typedPrograms);
    expect(plan.recommendations.length).toBeGreaterThanOrEqual(3);
    const scores = plan.recommendations.map((r) => r.fitScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("changing budget from high to low changes the top recommendation", () => {
    const richPlan = buildMockPlan(baseAnswers({ budgetUsdYear: "50k+" }), typedPrograms);
    const poorPlan = buildMockPlan(baseAnswers({ budgetUsdYear: "<5k", scholarshipNeed: "essential" }), typedPrograms);
    expect(richPlan.recommendations[0].program.id).not.toBe(poorPlan.recommendations[0].program.id);
  });

  it("restricting to one low-cost country changes the top pick vs. open-to-any", () => {
    const openPlan = buildMockPlan(baseAnswers(), typedPrograms);
    const turkeyOnlyPlan = buildMockPlan(baseAnswers({ countries: ["TR"] }), typedPrograms);
    expect(turkeyOnlyPlan.recommendations[0].program.country).toBe("TR");
    expect(openPlan.recommendations[0].program.id).not.toBe(turkeyOnlyPlan.recommendations[0].program.id);
  });

  it("labels MIT (selectivity 1) as reach and ASU (selectivity 3, easy fit) as safety for a strong low-budget-tolerant profile", () => {
    const plan = buildMockPlan(
      baseAnswers({ countries: ["US"], budgetUsdYear: "50k+", gpa: 4.8, sat: { value: 1560 }, ielts: { value: 8.0 } }),
      typedPrograms,
    );
    const mit = plan.recommendations.find((r) => r.program.id === "mit-eecs");
    const asu = plan.recommendations.find((r) => r.program.id === "asu-cs");
    expect(mit?.label).toBe("reach");
    expect(asu?.label).toBe("safety");
  });

  it("produces a roadmap with a next action and phases covering every task", () => {
    const plan = buildMockPlan(baseAnswers({ sat: { status: "none" } }), typedPrograms);
    expect(plan.roadmap.tasks.length).toBeGreaterThan(0);
    expect(plan.roadmap.nextActionTaskId).not.toBeNull();
    const allPhaseTaskIds = Object.values(plan.roadmap.phases).flat();
    expect(allPhaseTaskIds.sort()).toEqual(plan.roadmap.tasks.map((t) => t.id).sort());
  });

  it("marks every task's sourceUrl as either a real url or the literal string demo", () => {
    const plan = buildMockPlan(baseAnswers(), typedPrograms);
    for (const task of plan.roadmap.tasks) {
      expect(task.sourceUrl === "demo" || task.sourceUrl.startsWith("http")).toBe(true);
    }
  });
});
