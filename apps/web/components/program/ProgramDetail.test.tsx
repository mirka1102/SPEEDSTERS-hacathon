import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ProgramDetail } from "./ProgramDetail";
import { __resetProfileStoreForTests } from "@/lib/store";
import { getPrograms } from "@/lib/api";

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
});

describe("ProgramDetail", () => {
  it("shows a not-found state for an id that isn't in the catalog", () => {
    render(<ProgramDetail id="does-not-exist" />);
    expect(screen.getByText("Программа не найдена")).toBeInTheDocument();
  });

  it("shows the program's own facts for a valid id, with a source or demo badge on every cost figure", () => {
    const [program] = getPrograms();
    render(<ProgramDetail id={program.id} />);

    expect(screen.getByRole("heading", { name: program.university })).toBeInTheDocument();
    expect(screen.getAllByText(/Источник|Demo data/).length).toBeGreaterThanOrEqual(2);
  });

  it("toggles favorite from the detail page and persists it", () => {
    const [program] = getPrograms();
    render(<ProgramDetail id={program.id} />);

    fireEvent.click(screen.getByRole("button", { name: "Добавить в избранное" }));

    const stored = JSON.parse(window.localStorage.getItem("steer.profile.v1") ?? "{}");
    expect(stored.favorites).toContain(program.id);
  });
});
