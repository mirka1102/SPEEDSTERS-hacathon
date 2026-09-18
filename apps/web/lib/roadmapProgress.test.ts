import { describe, it, expect } from "vitest";
import { effectiveProgress } from "./roadmapProgress";
import type { Task } from "@shared/types";

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    category: "document",
    title: "Task",
    why: "Because",
    due: "2027-01-01",
    programIds: [],
    sourceUrl: "demo",
    done: false,
    ...overrides,
  };
}

describe("effectiveProgress", () => {
  it("returns 0% and no next action for an empty task list", () => {
    expect(effectiveProgress([], {})).toEqual({ progressPct: 0, nextActionTaskId: null, doneCount: 0 });
  });

  it("computes percent done from the progress map, not from Task.done", () => {
    const tasks = [task({ id: "a", due: "2027-01-01" }), task({ id: "b", due: "2027-02-01" })];
    const result = effectiveProgress(tasks, { a: "2026-09-18T00:00:00.000Z" });
    expect(result.progressPct).toBe(50);
    expect(result.doneCount).toBe(1);
  });

  it("picks the earliest undone task (by input order, already sorted by due date) as next action", () => {
    const tasks = [
      task({ id: "a", due: "2027-01-01" }),
      task({ id: "b", due: "2027-02-01" }),
      task({ id: "c", due: "2027-03-01" }),
    ];
    const result = effectiveProgress(tasks, { a: "2026-09-18T00:00:00.000Z" });
    expect(result.nextActionTaskId).toBe("b");
  });

  it("returns null next action once every task is done", () => {
    const tasks = [task({ id: "a" }), task({ id: "b" })];
    const result = effectiveProgress(tasks, { a: "x", b: "y" });
    expect(result.nextActionTaskId).toBeNull();
    expect(result.progressPct).toBe(100);
  });
});
