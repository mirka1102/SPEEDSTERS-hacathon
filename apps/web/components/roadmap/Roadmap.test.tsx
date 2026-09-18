import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Roadmap } from "./Roadmap";
import { __resetProfileStoreForTests } from "@/lib/store";

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
});

describe("Roadmap", () => {
  it("marks the page as step 6 of the 7-step journey", () => {
    render(<Roadmap />);
    expect(screen.getByText(/Шаг 6 из 7/)).toBeInTheDocument();
  });

  it("builds a plan from the top recommendations even with no Compare selection yet", () => {
    render(<Roadmap />);
    expect(screen.getByText("Следующий шаг")).toBeInTheDocument();
    expect(screen.getByText(/0 из \d+ готово/)).toBeInTheDocument();
  });

  it("moves the next action and progress forward when a task is checked off", () => {
    const { container } = render(<Roadmap />);
    const timelineCheckboxes = container.querySelectorAll<HTMLInputElement>('li input[type="checkbox"]');
    expect(timelineCheckboxes.length).toBeGreaterThan(0);

    fireEvent.click(timelineCheckboxes[0]);

    expect(screen.getByText(/1 из \d+ готово/)).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem("steer.profile.v1") ?? "{}");
    expect(Object.keys(stored.progress).length).toBe(1);
  });

  it("filters the timeline by category when a chip is clicked", () => {
    const { container } = render(<Roadmap />);
    fireEvent.click(screen.getByRole("button", { name: "Документы" }));
    const remainingCheckboxes = container.querySelectorAll('li input[type="checkbox"]');
    expect(remainingCheckboxes.length).toBeGreaterThan(0);
  });
});
