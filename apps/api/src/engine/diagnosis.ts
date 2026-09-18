import { Answers, Diagnosis } from '../../../../packages/shared/types';

export function generateDiagnosis(answers: Answers, programsFitCount: number): Diagnosis {
    let strengths = [];
    let limitations = [];

    if (answers.gpa >= 4.5) strengths.push({ key: 'academic', value: 'High GPA' });
    else if (answers.gpa < 3.5) limitations.push({ key: 'academic', value: 'Low GPA may restrict reach schools' });

    if (answers.budgetUsdYear === '50k+' || answers.budgetUsdYear === '30-50k') strengths.push({ key: 'budget', value: 'High budget allows broad options' });
    else if (answers.budgetUsdYear === '<5k') limitations.push({ key: 'budget', value: 'Tight budget limits options without full scholarships' });

    if (answers.ielts && (answers.ielts as any).value >= 7) strengths.push({ key: 'exams', value: 'Strong English proficiency' });
    if (!answers.ielts && !answers.toefl) limitations.push({ key: 'exams', value: 'Missing Language Exam' });

    return {
        strengths,
        limitations,
        goal: { fields: answers.fields, countries: answers.countries, intake: answers.intake },
        stats: { programsConsidered: 25, programsFit: programsFitCount, cheapestFitCostUsd: null }
    };
}
