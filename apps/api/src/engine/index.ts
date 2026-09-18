import { Answers, Plan, Program } from '../../../../packages/shared/types';
import { scoreAllPrograms, selectPrograms } from './select';
import { generateDiagnosis } from './diagnosis';
import { generateRoadmap } from './roadmap';

/**
 * `selectedIds` mirrors PlanRequest.selected (SPEC.md §7): once the user has chosen programs in
 * Compare, the roadmap is built for those, not the algorithmic top 3. Falls back to top 3 before
 * any selection exists.
 */
export function buildPlan(answers: Answers, programs: Program[], selectedIds?: string[]): Plan {
  const scoredAll = scoreAllPrograms(programs, answers);
  const recommendations = selectPrograms(scoredAll, answers);
  const top3 = recommendations.slice(0, 3);
  const diagnosis = generateDiagnosis(answers, programs.length, scoredAll, top3);

  const roadmapPrograms =
    selectedIds && selectedIds.length > 0
      ? programs.filter((p) => selectedIds.includes(p.id))
      : top3.map((r) => r.program);
  const roadmap = generateRoadmap(roadmapPrograms, answers);

  return { diagnosis, recommendations, roadmap };
}
