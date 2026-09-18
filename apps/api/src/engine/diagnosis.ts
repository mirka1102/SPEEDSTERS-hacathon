import { Answers, Diagnosis, FactorScores, Recommendation } from '../../../../packages/shared/types';

// Mirrors apps/web/lib/mockEngine.ts's buildDiagnosis (SPEC.md §5: "structured facts only").

function averageFactor(recommendations: Recommendation[], key: keyof FactorScores): number {
  if (recommendations.length === 0) return 0;
  return recommendations.reduce((sum, r) => sum + r.factors[key], 0) / recommendations.length;
}

function addDaysToDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function generateDiagnosis(
  answers: Answers,
  totalProgramsConsidered: number,
  allScored: Recommendation[],
  top3: Recommendation[],
): Diagnosis {
  const strengths: Diagnosis['strengths'] = [];
  const limitations: Diagnosis['limitations'] = [];

  if (averageFactor(top3, 'field') >= 0.8) strengths.push({ key: 'field_match' });
  if (averageFactor(top3, 'budget') >= 0.8) strengths.push({ key: 'budget_comfortable' });
  if (averageFactor(top3, 'academic') >= 0.8) strengths.push({ key: 'academic_strong' });
  if (averageFactor(top3, 'exams') >= 0.8) {
    if (answers.ielts && 'value' in answers.ielts) {
      strengths.push({ key: 'ielts_strong', value: answers.ielts.value });
    } else if (answers.sat && 'value' in answers.sat) {
      strengths.push({ key: 'sat_strong', value: answers.sat.value });
    } else {
      strengths.push({ key: 'exam_ready' });
    }
  }
  if (averageFactor(top3, 'country') >= 0.8) {
    strengths.push({ key: answers.countries.includes('open_to_any') ? 'country_flexible' : 'country_match' });
  }
  if (averageFactor(top3, 'language') >= 0.8) strengths.push({ key: 'language_ready' });

  if (averageFactor(top3, 'exams') <= 0.4) {
    const satMissing = answers.sat == null || 'status' in answers.sat;
    if (satMissing) limitations.push({ key: 'no_sat' });
  }
  if (averageFactor(top3, 'budget') <= 0.4) limitations.push({ key: 'budget_tight' });
  if (averageFactor(top3, 'academic') <= 0.4) limitations.push({ key: 'gpa_below_median' });
  if (
    averageFactor(top3, 'language') <= 0.4 &&
    answers.englishSelf == null &&
    answers.ielts == null &&
    answers.toefl == null
  ) {
    limitations.push({ key: 'english_untested' });
  }
  const fourMonthsFromNow = addDaysToDate(new Date(), 120);
  const soonDeadline = top3.find((r) => new Date(r.program.applicationDeadline) <= fourMonthsFromNow);
  if (soonDeadline) {
    limitations.push({ key: 'late_timeline', value: soonDeadline.program.applicationDeadline });
  }

  const fitPrograms = allScored.filter((r) => r.fitScore >= 55);
  const cheapestFitCostUsd = fitPrograms.length
    ? Math.min(...fitPrograms.map((r) => r.program.tuitionUsdYear + r.program.livingUsdYear))
    : null;

  return {
    strengths,
    limitations,
    goal: { fields: answers.fields, countries: answers.countries, intake: answers.intake },
    stats: {
      programsConsidered: totalProgramsConsidered,
      programsFit: fitPrograms.length,
      cheapestFitCostUsd,
    },
  };
}
