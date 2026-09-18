import { Program, Recommendation } from '../../../../packages/shared/types';
import { calculateScores } from './score';
import { determineLabel } from './label';

export function selectPrograms(programs: Program[], answers: any): Recommendation[] {
    const scored = programs.map(program => {
        const { factors, fitScore } = calculateScores(answers, program);
        const label = determineLabel(program, factors);
        return { program, factors, fitScore, label };
    });

    // Hard filters
    const sorted = scored
        .filter(r => r.factors.field > 0 && r.factors.language > 0)
        .sort((a, b) => b.fitScore - a.fitScore);
    
    if (sorted.length < 3) {
        return scored.sort((a, b) => b.fitScore - a.fitScore).slice(0, 3).map(r => ({ ...r, stretch: r.fitScore <= 40 }));
    }

    return sorted.slice(0, 5); 
}
