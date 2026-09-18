import type { Roadmap } from "@shared/types";
import { TimelineItem } from "./TimelineItem";

function monthKey(iso: string): string {
  return iso.slice(0, 7); // "2027-01"
}

function monthLabel(key: string): string {
  const date = new Date(`${key}-01T00:00:00.000Z`);
  const label = date.toLocaleDateString("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type CalendarViewProps = {
  roadmap: Roadmap;
  progress: Record<string, string>;
  onToggleDone: (taskId: string) => void;
};

/**
 * SPEC.md §10: the same task data as Timeline, re-grouped by calendar month
 * instead of phase — no new backend logic, just a second rendering, exactly
 * as the spec asks for.
 */
export function CalendarView({ roadmap, progress, onToggleDone }: CalendarViewProps) {
  const sorted = [...roadmap.tasks].sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  const months = Array.from(new Set(sorted.map((t) => monthKey(t.due))));

  return (
    <div>
      {months.map((key) => (
        <section key={key} className="border-t border-border py-2">
          <h2 className="pt-3 text-[0.8125rem] font-semibold tracking-tight text-muted-foreground">
            {monthLabel(key)}
          </h2>
          <ul className="divide-y divide-border">
            {sorted
              .filter((t) => monthKey(t.due) === key)
              .map((task) => (
                <TimelineItem
                  key={task.id}
                  task={task}
                  done={!!progress[task.id]}
                  onToggleDone={onToggleDone}
                />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
