import { Answers, Program, Plan } from '../../../../packages/shared/types';
import { selectPrograms } from './select';
import { generateDiagnosis } from './diagnosis';
import { generateRoadmap } from './roadmap';

export function buildPlan(answers: Answers, programs: Program[]): Plan {
    const recommendations = selectPrograms(programs, answers);
    const diagnosis = generateDiagnosis(answers, recommendations.length);
    const roadmap = generateRoadmap(answers, recommendations);

    return {
        diagnosis,
        recommendations,
        roadmap
    };
}
