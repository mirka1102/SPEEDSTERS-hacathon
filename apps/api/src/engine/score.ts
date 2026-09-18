import { Answers, Program, FactorScores } from '../../../../packages/shared/types';

export function calculateScores(answers: Answers, program: Program): { factors: FactorScores, fitScore: number } {
  // Field
  const field = answers.fields.includes(program.field as any) ? 1.0 : (answers.fields.length === 0 ? 0.8 : 0);
  
  // Budget
  let budget = 0;
  const budgetLimits: Record<string, number> = { '<5k': 5000, '5-15k': 15000, '15-30k': 30000, '30-50k': 50000, '50k+': 100000 };
  const maxB = budgetLimits[answers.budgetUsdYear] || 15000;
  const cost = program.tuitionUsdYear + program.livingUsdYear;
  if (cost <= maxB) {
      budget = 1.0;
  } else if (cost <= maxB * 1.5) {
      budget = 0.5;
  } else {
      budget = 0.2;
  }

  // Academic
  const gpaFit = answers.gpa >= program.gpaMin4 ? 1.0 : (answers.gpa >= program.gpaMin4 - 0.2 ? 0.5 : 0);
  const academic = gpaFit;

  // Exams
  let examScore = 1.0;
  if (program.ieltsMin && (!answers.ielts || (answers.ielts as any).status !== 'planning' && (answers.ielts as any).value < program.ieltsMin)) {
     examScore = 0.5;
  }
  if (program.satRequired && (!answers.sat || (answers.sat as any).status !== 'planning' && (answers.sat as any).value < (program.satMin || 1200))) {
     examScore = 0;
  }
  const exams = examScore;

  // Country
  const country = answers.countries.includes(program.country) || answers.countries.includes('open_to_any') ? 1.0 : 0.2;

  // Language
  const language = program.language === 'en' ? 1.0 : (answers.studyLanguage === 'open_to_learning' ? 0.8 : 0);

  // Personality
  let personality = 0.8;
  if (program.country === 'US' || program.country === 'UK') {
    personality = answers.personality === 'extrovert' || answers.openness === 'high' ? 1.0 : 0.5;
  } else if (program.country === 'DE' || program.country === 'KR') {
    personality = answers.personality === 'introvert' || answers.openness === 'low' ? 1.0 : 0.6;
  }

  // Weights
  let weights = { field: 0.25, budget: 0.25, academic: 0.15, exams: 0.15, country: 0.12, language: 0.05, personality: 0.03 };
  if (answers.scholarshipNeed === 'essential') {
      weights.budget = 0.4;
      weights.field = 0.15;
  }

  const factors: FactorScores = { field, budget, academic, exams, country, language, personality };
  const fitScore = Math.round(
      (factors.field * weights.field +
      factors.budget * weights.budget +
      factors.academic * weights.academic +
      factors.exams * weights.exams +
      factors.country * weights.country +
      factors.language * weights.language +
      factors.personality * weights.personality) * 100
  );

  return { factors, fitScore: Math.min(100, fitScore) };
}
