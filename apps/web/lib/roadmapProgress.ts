import type { Task } from "@shared/types";

export type EffectiveProgress = {
  progressPct: number;
  nextActionTaskId: string | null;
  doneCount: number;
};

/**
 * `buildMockPlan`'s roadmap is always freshly computed with every task undone
 * (SPEC.md §5: "a freshly built plan has no persisted progress"). Real done
 * state lives in the store's `progress` map, so the screen recomputes percent
 * and next-action here instead of trusting `Roadmap.progressPct`. `tasks` is
 * already sorted by due date, so the first undone one is the earliest.
 */
export function effectiveProgress(tasks: Task[], progress: Record<string, string>): EffectiveProgress {
  const doneCount = tasks.filter((t) => progress[t.id]).length;
  const progressPct = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  const nextActionTaskId = tasks.find((t) => !progress[t.id])?.id ?? null;
  return { progressPct, nextActionTaskId, doneCount };
}
