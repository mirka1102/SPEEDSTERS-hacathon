"use client";

import { useState } from "react";
import type { Roadmap, TaskCategory } from "@shared/types";
import { cn } from "@/lib/utils";
import { ROADMAP_PHASE_NAMES, ROADMAP_PHASE_ORDER, TASK_CATEGORY_NAMES } from "@/lib/labels";
import { TimelineItem } from "./TimelineItem";

type TimelineProps = {
  roadmap: Roadmap;
  progress: Record<string, string>;
  onToggleDone: (taskId: string) => void;
};

const ALL_CATEGORIES: TaskCategory[] = ["exam", "document", "deadline", "academic", "activity", "finance"];

/**
 * Vertical timeline grouped by phase (SPEC.md §5/§8), with category chips to
 * filter down to one kind of task. A phase with nothing left after filtering
 * is simply omitted rather than shown empty.
 */
export function Timeline({ roadmap, progress, onToggleDone }: TimelineProps) {
  const [filter, setFilter] = useState<TaskCategory | null>(null);
  const tasksById = new Map(roadmap.tasks.map((t) => [t.id, t]));
  const usedCategories = ALL_CATEGORIES.filter((c) => roadmap.tasks.some((t) => t.category === c));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
            filter === null ? "border-primary bg-primary/[0.06] text-primary" : "border-border text-muted-foreground",
          )}
        >
          Все
        </button>
        {usedCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
              filter === category
                ? "border-primary bg-primary/[0.06] text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {TASK_CATEGORY_NAMES[category]}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {ROADMAP_PHASE_ORDER.map((phase) => {
          const taskIds = roadmap.phases[phase].filter((id) => {
            if (!filter) return true;
            return tasksById.get(id)?.category === filter;
          });
          if (taskIds.length === 0) return null;

          return (
            <section key={phase} className="border-t border-border py-2">
              <h2 className="pt-3 text-[0.8125rem] font-semibold tracking-tight text-muted-foreground">
                {ROADMAP_PHASE_NAMES[phase]}
              </h2>
              <ul className="divide-y divide-border">
                {taskIds.map((id) => {
                  const task = tasksById.get(id);
                  if (!task) return null;
                  return (
                    <TimelineItem key={id} task={task} done={!!progress[id]} onToggleDone={onToggleDone} />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
