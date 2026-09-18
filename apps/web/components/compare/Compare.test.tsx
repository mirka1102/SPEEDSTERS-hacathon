import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Compare } from "./Compare";
import { DEFAULT_ANSWERS, __resetProfileStoreForTests } from "@/lib/store";
import { getPlan } from "@/lib/api";

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
});

/** Selects the two programs the mock engine would actually recommend for DEFAULT_ANSWERS, so
 * the test never depends on hardcoded ids ranking within the algorithm's top slice. */
function seedTopTwoSelected() {
  const { recommendations } = getPlan(DEFAULT_ANSWERS);
  const ids = recommendations.slice(0, 2).map((r) => r.program.id);
  window.localStorage.setItem(
    "steer.profile.v1",
    JSON.stringify({ answers: DEFAULT_ANSWERS, selectedPrograms: ids, favorites: [], progress: {} }),
  );
  return recommendations.slice(0, 2);
}

describe("Compare", () => {
  it("prompts to pick 2-3 programs when fewer than 2 are selected", () => {
    render(<Compare />);
    expect(screen.getByText(/Выбери 2–3 программы/)).toBeInTheDocument();
  });

  it("shows a table column per selected program once 2+ are selected", () => {
    const [first, second] = seedTopTwoSelected();
    render(<Compare />);
    expect(screen.getByText(first.program.university)).toBeInTheDocument();
    expect(screen.getByText(second.program.university)).toBeInTheDocument();
  });

  it("links forward to the roadmap", () => {
    seedTopTwoSelected();
    render(<Compare />);
    expect(screen.getByRole("link", { name: "Собрать план" })).toHaveAttribute("href", "/roadmap");
  });
});
