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
        const programSummaries = plan.recommendations.map((r) => ({
            id: r.program.id,
            university: r.program.university,
            program: r.program.program,
            fitScore: r.fitScore,
            label: r.label,
            factors: r.factors,
        }));

        const prompt = `You are an AI admissions consultant. You have determined the following facts about the student:
        Strengths: ${JSON.stringify(plan.diagnosis.strengths)}
        Limitations: ${JSON.stringify(plan.diagnosis.limitations)}
        Recommended programs (with the engine's own fit score/label/factors already computed): ${JSON.stringify(programSummaries)}

        Write a 3-4 sentence diagnosis in ${lang === 'ru' ? 'Russian' : 'English'}.
        Then write exactly one whyText explanation sentence per program, keyed by its exact "id" field above.
        Return ONLY valid JSON, no markdown code fences, in this exact shape:
        { "diagnosisText": "...", "whyText": { "<id from above>": "...", ... } }
        Do NOT invent any factual numbers, probabilities, or missing context — only phrase the facts given above.`;

        const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1000,
            system: "You output nothing but raw JSON. Never wrap it in markdown code fences.",
            messages: [{ role: "user", content: prompt }]
        });

        const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
        // Haiku sometimes wraps its JSON in a ```json ... ``` fence despite the system prompt —
        // strip it rather than fail and fall back to the (worse) template text unnecessarily.
        const content = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
        return JSON.parse(content);
    } catch (e) {
        console.error('LLM Failed, using fallback', e);
        return getFallbackExplanation(plan, lang);
    }
}
