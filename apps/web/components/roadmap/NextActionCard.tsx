import type { Task } from "@shared/types";
import { Progress } from "@/components/ui/progress";
import { TASK_CATEGORY_NAMES, formatDate } from "@/lib/labels";

type NextActionCardProps = {
  task: Task | null;
  progressPct: number;
  doneCount: number;
  totalCount: number;
  onToggleDone: (taskId: string) => void;
};

/**
 * Step 7 of SPEC.md §2, pinned to the top of `/roadmap`: one task, named as
 * "the" next thing to do, plus the overall percent. Returning users land
 * here first (SPEC.md §2 route table), so this card has to work standalone
 * — it never assumes the reader scrolled up from the timeline below it.
 */
export function NextActionCard({ task, progressPct, doneCount, totalCount, onToggleDone }: NextActionCardProps) {
  return (
    <div className="rounded-xl border border-primary/30 bg-accent p-5">
      <div className="flex items-center justify-between gap-3 text-[0.8125rem] text-accent-foreground/80">
        <span className="font-medium">Следующий шаг</span>
        <span className="tabular-nums">
          {doneCount} из {totalCount} готово
        </span>
      </div>

      {task ? (
        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked="false"
            aria-label={`Отметить «${task.title}» выполненным`}
            onClick={() => onToggleDone(task.id)}
            className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-primary/50 transition-colors hover:bg-primary/10"
          />
          <span className="min-w-0">
            <span className="block text-[0.6875rem] font-medium tracking-wide text-primary uppercase">
              {TASK_CATEGORY_NAMES[task.category]}
            </span>
            <span className="mt-0.5 block text-[1.0625rem] leading-snug font-semibold tracking-tight text-pretty">
              {task.title}
            </span>
            <span className="mt-1 block text-[0.8125rem] leading-relaxed text-accent-foreground/80 text-pretty">
              {task.why}
            </span>
            <span className="mt-1.5 block text-[0.8125rem] font-medium tabular-nums">
              Срок: {formatDate(task.due)}
            </span>
          </span>
        </label>
      ) : (
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty">
          Все шаги плана отмечены выполненными — отличная работа.
        </p>
      )}

      <Progress value={progressPct} aria-label="Прогресс по плану" className="mt-4" />
    </div>
  );
}
