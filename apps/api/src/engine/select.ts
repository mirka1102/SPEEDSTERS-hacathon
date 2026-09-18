import { Answers, Program, Recommendation } from '../../../../packages/shared/types';
import { calculateScores, fieldScore, hasOtherLanguageAtB1Plus } from './score';
import { determineLabel } from './label';

// Mirrors apps/web/lib/mockEngine.ts's scorePrograms + selectRecommendations (SPEC.md §5):
// field=0 or an unmet study-language requirement hard-excludes a program; if fewer than 3
// survive, the filters are relaxed and the backfilled ones are marked `stretch: true` rather
// than silently included as if they'd passed normally.
function passesHardFilters(answers: Answers, program: Program): boolean {
  if (fieldScore(answers.fields, program.field) === 0) return false;
  if (answers.studyLanguage === 'english_only' && program.language !== 'en') {
    if (!hasOtherLanguageAtB1Plus(answers, program.language)) return false;
  }
  return true;
}

/** Scores every program with no filtering — used both as selectPrograms' input and directly by
 * the diagnosis step, which needs "how many of ALL programs fit," not just the curated top N. */
export function scoreAllPrograms(programs: Program[], answers: Answers): Recommendation[] {
  return programs.map((program) => {
    const { factors, fitScore } = calculateScores(answers, program);
    const label = determineLabel(program, factors);
    return { program, factors, fitScore, label };
  });
}

export function selectPrograms(scored: Recommendation[], answers: Answers): Recommendation[] {
  const passing = scored.filter((r) => passesHardFilters(answers, r.program));

  let candidates: Recommendation[];
  if (passing.length >= 3) {
    candidates = passing;
  } else {
    const passingIds = new Set(passing.map((r) => r.program.id));
    const needed = 3 - passing.length;
    const relaxed = scored
      .filter((r) => !passingIds.has(r.program.id))
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, needed)
      .map((r) => ({ ...r, stretch: true as const }));
    candidates = [...passing, ...relaxed];
  }

  const sorted = [...candidates].sort((a, b) => b.fitScore - a.fitScore);
  if (sorted.length <= 3) return sorted;

  // Ensure label diversity in the top 3 where possible (SPEC.md §5) instead of e.g. three
  // "match"-labeled programs crowding out an obvious safety or reach pick.
  let top3 = sorted.slice(0, 3);
  let pool = sorted.slice(3);
  const labels = new Set(top3.map((r) => r.label));
  if (labels.size === 1) {
    const targetLabel = top3[2].label;
    const idx = pool.findIndex((r) => r.label !== targetLabel && r.fitScore >= 55);
    if (idx !== -1) {
      const candidate = pool[idx];
      const displaced = top3[2];
      top3 = [top3[0], top3[1], candidate];
      pool = [...pool.slice(0, idx), displaced, ...pool.slice(idx + 1)];
    }
  }

  const rest = pool.slice(0, 3);
  return [...top3, ...rest].sort((a, b) => b.fitScore - a.fitScore);
}
