import type { Task } from "@shared/types";

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * A single-event .ics for one roadmap deadline (SPEC.md §10 "remind me" —
 * works with no backend or push-notification infrastructure). All-day event
 * on the task's due date, so it isn't tied to a timezone-sensitive hour.
 */
export function buildIcsForTask(task: Task, now: Date = new Date()): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Steer//Admission Route//RU",
    "BEGIN:VEVENT",
    `UID:${task.id}@steer.app`,
    `DTSTAMP:${icsTimestamp(now)}`,
    `DTSTART;VALUE=DATE:${task.due.replace(/-/g, "")}`,
    `SUMMARY:${escapeIcsText(task.title)}`,
    `DESCRIPTION:${escapeIcsText(task.why)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Triggers a browser download of the task's .ics file — the actual DOM side effect, kept
 * separate from `buildIcsForTask` so the string-building logic stays unit-testable. */
export function downloadIcsForTask(task: Task): void {
  const blob = new Blob([buildIcsForTask(task)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${task.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
