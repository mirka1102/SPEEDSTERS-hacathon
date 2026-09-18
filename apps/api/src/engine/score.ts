import { Answers, BudgetBand, ExamScore, Field, FactorScores, Program } from '../../../../packages/shared/types';

// Mirrors apps/web/lib/mockEngine.ts's factor formulas exactly (SPEC.md §5) so the demo behaves
// the same whether the frontend is pointed at the mock engine or this real one.

const ADJACENT_FIELD: Partial<Record<Field, Field>> = {
  cs: 'eng',
  eng: 'cs',
  business: 'natsci',
  natsci: 'business',
};

export function fieldScore(fields: Field[], programField: Program['field']): number {
  if (fields.includes('undecided')) return 0.7;
  if (fields.includes(programField)) return 1;
  if (fields.some((f) => ADJACENT_FIELD[f] === programField)) return 0.6;
  return 0;
}

const BUDGET_BAND_USD: Record<BudgetBand, number> = {
  '<5k': 5000,
  '5-15k': 15000,
  '15-30k': 30000,
  '30-50k': 50000,
  '50k+': 80000,
};

function budgetScore(answers: Answers, program: Program): number {
  const cost = program.tuitionUsdYear + program.livingUsdYear;
  const budgetNumber = BUDGET_BAND_USD[answers.budgetUsdYear];
  const ratio = cost === 0 ? 2 : budgetNumber / cost;
  let score = Math.min(1, ratio);
  if (score < 1 && program.scholarshipAvailable) {
    score = Math.min(1, score + 0.25);
  }
  return score;
}

function academicScore(answers: Answers, program: Program): number {
  const diff = answers.gpa - program.gpaMin4;
  let score = diff >= 0.3 ? 1 : diff >= 0 ? 0.8 : diff >= -0.3 ? 0.5 : 0.2;
  if (answers.achievements === 'national' || answers.achievements === 'international') {
    score = Math.min(1, score + 0.1);
  }
  return score;
}

// Bug fixed here: the previous version read `.value` off an ExamScore that could be the
// `{status: "planning" | "none"}` variant, which reads as `undefined` at runtime, so
// `undefined < program.satMin` silently evaluated to `false` — a student who explicitly said
// they had no SAT score could score as fully exam-ready. This checks the variant first.
function examComponentScore(exam: ExamScore | null, min: number | null): number {
  if (min == null) return 1;
  if (exam == null) return 0.2;
  if ('status' in exam) return exam.status === 'planning' ? 0.4 : 0.2;
  return exam.value >= min ? 1 : 0.5;
}

function examsScore(answers: Answers, program: Program): number {
  let englishComponent: number;
  if (program.ieltsMin == null && program.toeflMin == null) {
    englishComponent = 1;
  } else {
    const candidates: number[] = [];
    if (program.ieltsMin != null) candidates.push(examComponentScore(answers.ielts, program.ieltsMin));
    if (program.toeflMin != null) candidates.push(examComponentScore(answers.toefl, program.toeflMin));
    englishComponent = Math.max(...candidates);
  }
  const satComponent = program.satRequired ? examComponentScore(answers.sat, program.satMin) : 1;
  return (englishComponent + satComponent) / 2;
}

function countryScore(answers: Answers, program: Program): number {
  if ((answers.countries as string[]).includes(program.country)) return 1;
  if (answers.countries.includes('open_to_any')) return 0.7;
  return 0.2;
}

export function hasOtherLanguageAtB1Plus(answers: Answers, language: string): boolean {
  return answers.otherLanguages.some(
    (o) => o.language === language && (o.level === 'B1' || o.level === 'B2' || o.level === 'C1'),
  );
}

function languageScore(answers: Answers, program: Program): number {
  if (program.language === 'en') {
    const ieltsOk = !!answers.ielts && 'value' in answers.ielts && answers.ielts.value >= 6;
    const toeflOk = !!answers.toefl && 'value' in answers.toefl && answers.toefl.value >= 80;
    const selfOk = answers.englishSelf === 'B2' || answers.englishSelf === 'C1';
    if (ieltsOk || toeflOk || selfOk) return 1;
    if (answers.englishSelf === 'B1') return 0.6;
    return 0.3;
  }
  return hasOtherLanguageAtB1Plus(answers, program.language) ? 0.8 : 0.3;
}

export function getWeights(answers: Answers): Record<keyof FactorScores, number> {
  if (answers.scholarshipNeed === 'essential') {
    return { field: 0.2, budget: 0.32, academic: 0.15, exams: 0.15, country: 0.1, language: 0.08 };
  }
  return { field: 0.25, budget: 0.25, academic: 0.15, exams: 0.15, country: 0.12, language: 0.08 };
}

export function calculateScores(answers: Answers, program: Program): { factors: FactorScores; fitScore: number } {
  const factors: FactorScores = {
    field: fieldScore(answers.fields, program.field),
    budget: budgetScore(answers, program),
    academic: academicScore(answers, program),
    exams: examsScore(answers, program),
    country: countryScore(answers, program),
    language: languageScore(answers, program),
  };

  const weights = getWeights(answers);
  const weightedSum =
    factors.field * weights.field +
    factors.budget * weights.budget +
    factors.academic * weights.academic +
    factors.exams * weights.exams +
    factors.country * weights.country +
    factors.language * weights.language;
  const fitScore = Math.round(weightedSum * 100);

  return { factors, fitScore };
}
