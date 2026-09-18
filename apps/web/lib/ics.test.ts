import { describe, it, expect } from "vitest";
import { buildIcsForTask } from "./ics";
import type { Task } from "@shared/types";

const task: Task = {
  id: "deadline-mit-eecs-0",
  category: "deadline",
  title: "Подать заявку в MIT",
  why: "Дедлайн подачи заявки на BSc EECS.",
  due: "2027-01-01",
  programIds: ["mit-eecs"],
  sourceUrl: "https://mitadmissions.org",
  done: false,
};

describe("buildIcsForTask", () => {
  const ics = buildIcsForTask(task, new Date("2026-09-18T12:00:00.000Z"));

  it("is a valid single-event VCALENDAR", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("uses an all-day DTSTART on the task's own due date", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20270101");
  });

  it("carries the task's id, title, and why text", () => {
    expect(ics).toContain("UID:deadline-mit-eecs-0@steer.app");
    expect(ics).toContain("SUMMARY:Подать заявку в MIT");
    expect(ics).toContain("DESCRIPTION:Дедлайн подачи заявки на BSc EECS.");
  });

  it("escapes commas and semicolons in free text per RFC 5545", () => {
    const withPunctuation = buildIcsForTask({ ...task, title: "A; B, C" });
    expect(withPunctuation).toContain("SUMMARY:A\\; B\\, C");
  });
});
