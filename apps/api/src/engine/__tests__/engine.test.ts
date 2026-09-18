import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildPlan } from '../index';
import type { Answers, Program } from '../../../../../packages/shared/types';

const programs: Program[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../data/programs.json'), 'utf-8'),
);

function baseAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    grade: '11',
    intake: 'Fall 2027',
    fields: ['cs'],
    interests: [],
    gpa: 4.5,
    achievements: 'none',
    ielts: { value: 7.0 },
    toefl: null,
    sat: { value: 1500 },
    englishSelf: null,
    otherLanguages: [],
    countries: ['US', 'UK', 'DE', 'KR', 'TR'],
    studyLanguage: 'english_only',
    budgetUsdYear: '50k+',
    scholarshipNeed: 'not_needed',
    activities: ['projects'],
    hoursPerWeek: 10,
    ...overrides,
  };
}

describe('buildPlan', () => {
  it('returns at least 3 recommendations sorted by fit score descending', () => {
    const plan = buildPlan(baseAnswers(), programs);
    expect(plan.recommendations.length).toBeGreaterThanOrEqual(3);
    const scores = plan.recommendations.map((r) => r.fitScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('changing budget from high to low changes the top recommendation', () => {
    const rich = buildPlan(baseAnswers({ budgetUsdYear: '50k+' }), programs);
    const poor = buildPlan(baseAnswers({ budgetUsdYear: '<5k', scholarshipNeed: 'essential' }), programs);
    expect(rich.recommendations[0].program.id).not.toBe(poor.recommendations[0].program.id);
  });

  it('does not treat a student with no SAT score as exam-ready for a SAT-required program', () => {
    // Regression test: the original exam-scoring code read `.value` off the `{status:"none"}`
    // variant of ExamScore, which is `undefined` at runtime, so `undefined < satMin` silently
    // evaluated `false` and the student scored as if they'd met the requirement.
    const noSat = buildPlan(baseAnswers({ sat: { status: 'none' }, countries: ['US'] }), programs);
    const withSat = buildPlan(baseAnswers({ sat: { value: 1550 }, countries: ['US'] }), programs);

    const mitNoSat = noSat.recommendations.find((r) => r.program.id === 'mit-eecs');
    const mitWithSat = withSat.recommendations.find((r) => r.program.id === 'mit-eecs');
    expect(mitNoSat).toBeDefined();
    expect(mitWithSat).toBeDefined();
    expect(mitNoSat!.factors.exams).toBeLessThan(mitWithSat!.factors.exams);
  });

  it('reports programsConsidered as the actual catalog size, not a hardcoded number', () => {
    const plan = buildPlan(baseAnswers(), programs);
    expect(plan.diagnosis.stats.programsConsidered).toBe(programs.length);
  });

  it('builds a roadmap with real per-program tasks, not the same two hardcoded ones every time', () => {
    const kaistOnly = buildPlan(baseAnswers({ countries: ['KR'] }), programs, ['kaist-cs']);
    const bilkentOnly = buildPlan(baseAnswers({ countries: ['TR'] }), programs, ['bilkent-cs']);

    const kaistDeadlineTask = kaistOnly.roadmap.tasks.find(
      (t) => t.category === 'deadline' && t.programIds.includes('kaist-cs'),
    );
    const bilkentDeadlineTask = bilkentOnly.roadmap.tasks.find(
      (t) => t.category === 'deadline' && t.programIds.includes('bilkent-cs'),
    );
    expect(kaistDeadlineTask).toBeDefined();
    expect(bilkentDeadlineTask).toBeDefined();
    expect(kaistDeadlineTask!.due).not.toBe(bilkentDeadlineTask!.due);
  });

  it('builds the roadmap from selectedIds (Compare choice) instead of always the algorithmic top 3', () => {
    const noSelection = buildPlan(baseAnswers(), programs);
    const top3Ids = noSelection.recommendations.slice(0, 3).map((r) => r.program.id);
    const notInTop3 = noSelection.recommendations.find((r) => !top3Ids.includes(r.program.id));
    expect(notInTop3).toBeDefined();

    const selectedPlan = buildPlan(baseAnswers(), programs, [top3Ids[0], notInTop3!.program.id]);
    const roadmapProgramIds = new Set(selectedPlan.roadmap.tasks.flatMap((t) => t.programIds));
    expect(roadmapProgramIds.has(notInTop3!.program.id)).toBe(true);
  });

  it('marks every task sourceUrl as either a real url or the literal string demo', () => {
    const plan = buildPlan(baseAnswers(), programs);
    for (const task of plan.roadmap.tasks) {
      expect(task.sourceUrl === 'demo' || task.sourceUrl.startsWith('http')).toBe(true);
    }
  });

  it('relaxes hard filters and marks backfilled recommendations stretch:true when fewer than 3 programs match', () => {
    const plan = buildPlan(baseAnswers({ fields: ['design'] }), programs);
    expect(plan.recommendations.length).toBeGreaterThanOrEqual(3);
    for (const rec of plan.recommendations) {
      expect(rec.stretch).toBe(true);
    }
  });
});
