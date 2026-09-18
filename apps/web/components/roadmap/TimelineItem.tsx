import { CalendarPlusIcon } from "lucide-react";
import type { Task } from "@shared/types";
import { cn } from "@/lib/utils";
import { TASK_CATEGORY_NAMES, formatDate } from "@/lib/labels";
import { downloadIcsForTask } from "@/lib/ics";
import { SourceBadge } from "@/components/program/SourceBadge";

type TimelineItemProps = {
  task: Task;
  done: boolean;
  onToggleDone: (taskId: string) => void;
};

/** One roadmap task: category chip, title, why, due date, done checkbox, source/demo badge. */
export function TimelineItem({ task, done, onToggleDone }: TimelineItemProps) {
  return (
    <li className="flex items-start gap-3 py-3.5">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-primary"
          checked={done}
          onChange={() => onToggleDone(task.id)}
          aria-label={task.title}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
              {TASK_CATEGORY_NAMES[task.category]}
            </span>
            <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
              {formatDate(task.due)}
            </span>
          </span>
          <span
            className={cn(
              "mt-1 block text-[0.9375rem] leading-snug font-medium tracking-tight text-pretty",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted-foreground text-pretty">
            {task.why}
          </span>
        </span>
      </label>
      <div className="mt-1 flex shrink-0 items-center gap-1.5">
        <SourceBadge sourceUrl={task.sourceUrl} />
        <button
          type="button"
          onClick={() => downloadIcsForTask(task)}
          aria-label={`Напомнить: скачать .ics для «${task.title}»`}
          title="Скачать .ics"
          className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <CalendarPlusIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
