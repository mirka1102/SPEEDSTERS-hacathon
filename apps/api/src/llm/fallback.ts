import { Plan, ExplainResponse } from '../../../../packages/shared/types';

export function getFallbackExplanation(plan: Plan, lang: 'ru' | 'en'): ExplainResponse {
    const diagnosisText = lang === 'ru' ?
        `AI пояснение недоступно. Выводим автоматическую сводку. Ваши сильные стороны: ${plan.diagnosis.strengths.length}. Для подбора найдено ${plan.diagnosis.stats.programsFit} вузов.` :
        `AI explanation unavailable. Summary: You have ${plan.diagnosis.strengths.length} strengths. Found ${plan.diagnosis.stats.programsFit} matching programs.`;
    
    const whyText: Record<string, string> = {};
    for (const r of plan.recommendations) {
        whyText[r.program.id] = lang === 'ru' ? 
            `Соответствие по нашим подсчетам: ${r.fitScore}%.` : 
            `Calculated match score: ${r.fitScore}%.`;
    }

    return { diagnosisText, whyText };
}
