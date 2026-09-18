import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Diagnosis } from "./Diagnosis";
import { __resetProfileStoreForTests } from "@/lib/store";

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
});

describe("Diagnosis", () => {
  it("marks the page as step 3 of the 7-step journey", () => {
    render(<Diagnosis />);
    expect(screen.getByText(/Шаг 3 из 7/)).toBeInTheDocument();
    expect(screen.getByText("Диагностика")).toBeInTheDocument();
  });

  it("shows the goal sentence built from the default answers and a link to edit it", () => {
    render(<Diagnosis />);
    expect(screen.getByText(/Цель:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Изменить" })).toHaveAttribute("href", "/profile");
  });

  it("links forward to recommendations", () => {
    render(<Diagnosis />);
    expect(screen.getByRole("link", { name: "Смотреть рекомендации" })).toHaveAttribute(
      "href",
      "/recommendations",
    );
  });
});
