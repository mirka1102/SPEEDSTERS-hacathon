import { Anthropic } from '@anthropic-ai/sdk';
import { Plan, ExplainResponse } from '../../../../packages/shared/types';
import { getFallbackExplanation } from './fallback';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'empty'
});

export async function generateExplanation(plan: Plan, lang: 'ru'|'en'): Promise<ExplainResponse> {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'empty') {
        return getFallbackExplanation(plan, lang);
    }

    try {
        const prompt = `You are an AI admissions consultant. You have determined the following facts about the student:
        Strengths: ${JSON.stringify(plan.diagnosis.strengths)}
        Limitations: ${JSON.stringify(plan.diagnosis.limitations)}
        Programs selected: ${JSON.stringify(plan.recommendations.map(r => r.program.university))}
        
        Write a 3-4 sentence diagnosis in ${lang === 'ru' ? 'Russian' : 'English'}.
        Then write exactly one whyText explanation sentence per program ID.
        Return ONLY valid JSON like so:
        { "diagnosisText": "...", "whyText": { "prog1_id": "...", ... } }
        Do NOT invent any factual numbers, probabilities, or missing context.`;

        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            system: "You output nothing but raw JSON.",
            messages: [{ role: "user", content: prompt }]
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
        return JSON.parse(content);
    } catch (e) {
        console.error('LLM Failed, using fallback', e);
        return getFallbackExplanation(plan, lang);
    }
}
