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

  it("relaxes hard filters and marks backfilled recommendations stretch:true when fewer than 3 programs match", () => {
    // No program in the fixture has field "design", and "design" has no adjacent field, so every
    // program is hard-filtered out (0 pass) — this must trigger the SPEC.md §5 relaxation fallback.
    const plan = buildMockPlan(baseAnswers({ fields: ["design"] }), typedPrograms);
    expect(plan.recommendations.length).toBeGreaterThanOrEqual(3);
    for (const rec of plan.recommendations) {
      expect(rec.stretch).toBe(true);
    }
  });

  it("builds the roadmap from selectedIds (Compare's choice) instead of the algorithmic top 3 when given", () => {
    const noSelection = buildMockPlan(baseAnswers(), typedPrograms);
    const top3Ids = noSelection.recommendations.slice(0, 3).map((r) => r.program.id);

    // Pick two recommended programs that are NOT both in the top 3, so the roadmap's program set
    // must visibly differ from the no-selection case.
    const notInTop3 = noSelection.recommendations.find((r) => !top3Ids.includes(r.program.id));
    expect(notInTop3).toBeDefined();
    const selectedIds = [top3Ids[0], notInTop3!.program.id];

    const selectedPlan = buildMockPlan(baseAnswers(), typedPrograms, selectedIds);
    const roadmapProgramIds = new Set(selectedPlan.roadmap.tasks.flatMap((t) => t.programIds));
    expect(roadmapProgramIds.has(notInTop3!.program.id)).toBe(true);
    // recommendations themselves are unaffected by the selection — only the roadmap changes.
    expect(selectedPlan.recommendations.map((r) => r.program.id)).toEqual(
      noSelection.recommendations.map((r) => r.program.id),
    );
  });
});

function testProgram(overrides: Partial<Program>): Program {
  return {
    id: "test-program",
    university: "Test University",
    program: "Test Program",
    country: "US",
    city: "Testville",
    field: "cs",
    language: "en",
    tuitionUsdYear: 10000,
    livingUsdYear: 5000,
    scholarshipAvailable: false,
    scholarshipNote: null,
    gpaMin4: 3.0,
    ieltsMin: null,
    toeflMin: null,
    satRequired: false,
    satMin: null,
    otherRequirements: [],
    selectivity: 2,
    applicationDeadline: "2027-01-01",
    intake: "Fall 2027",
    sourceUrl: "https://example.com",
    dataStatus: "demo",
    imageUrl: null,
    campusLifeNote: null,
    ...overrides,
  };
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("buildMockPlan roadmap phases", () => {
  it("puts a task tied to a later application deadline into after_submission once an earlier selected program's deadline takes priority", () => {
    const customPrograms: Program[] = [
      testProgram({ id: "prog-early", university: "Early University", applicationDeadline: isoDaysFromNow(70) }),
      testProgram({ id: "prog-mid", university: "Mid University", applicationDeadline: isoDaysFromNow(90) }),
      testProgram({ id: "prog-late", university: "Late University", applicationDeadline: isoDaysFromNow(200) }),
    ];

    const plan = buildMockPlan(baseAnswers(), customPrograms);

    const lateDeadlineTask = plan.roadmap.tasks.find(
      (t) => t.category === "deadline" && t.programIds.includes("prog-late"),
    );
    expect(lateDeadlineTask).toBeDefined();
    expect(plan.roadmap.phases.after_submission).toContain(lateDeadlineTask!.id);

    // Sanity check: the earliest-deadline program's own deadline task must NOT be after_submission
    // (it defines the boundary, so it can't be strictly after itself).
    const earlyDeadlineTask = plan.roadmap.tasks.find(
      (t) => t.category === "deadline" && t.programIds.includes("prog-early"),
    );
    expect(plan.roadmap.phases.after_submission).not.toContain(earlyDeadlineTask!.id);
  });
});
