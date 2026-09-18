import { Program, FactorScores, Label } from '../../../../packages/shared/types';

export function determineLabel(program: Program, factors: FactorScores): Label {
    if (program.selectivity === 1 || factors.academic < 0.8 || factors.exams < 0.5) return 'reach';
    if (program.selectivity === 3 && factors.academic === 1 && factors.exams >= 0.8 && factors.budget >= 0.9) return 'safety';
    return 'match';
}
