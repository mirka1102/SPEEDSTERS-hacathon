import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Favorites } from "./Favorites";
import { __resetProfileStoreForTests, DEFAULT_ANSWERS } from "@/lib/store";
import { getPrograms } from "@/lib/api";

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
});

function seedFavorites(ids: string[]) {
  window.localStorage.setItem(
    "steer.profile.v1",
    JSON.stringify({ answers: DEFAULT_ANSWERS, selectedPrograms: [], favorites: ids, progress: {} }),
  );
}

describe("Favorites", () => {
  it("shows an empty state with a way back when nothing is bookmarked", () => {
    render(<Favorites />);
    expect(screen.getByText(/Пока ничего не сохранено/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "К рекомендациям" })).toHaveAttribute(
      "href",
      "/recommendations",
    );
  });

  it("shows every bookmarked program with a real, current fit score even if it's not a top pick", () => {
    const programs = getPrograms();
    const notCsFocused = programs.find((p) => p.field !== "cs") ?? programs[programs.length - 1];
    seedFavorites([programs[0].id, notCsFocused.id]);

    render(<Favorites />);
    expect(screen.getByText(programs[0].university)).toBeInTheDocument();
    expect(screen.getByText(notCsFocused.university)).toBeInTheDocument();
    expect(screen.getAllByText(/из 100/).length).toBe(2);
  });
});
