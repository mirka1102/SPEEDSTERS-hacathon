import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Recommendations } from "./Recommendations";
import { __resetProfileStoreForTests } from "@/lib/store";

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
});

describe("Recommendations", () => {
  it("marks the page as step 4 of the 7-step journey", () => {
    render(<Recommendations />);
    expect(screen.getByText(/Шаг 4 из 7/)).toBeInTheDocument();
  });

  it("shows at least 3 program cards for the default answers", () => {
    render(<Recommendations />);
    expect(screen.getAllByRole("article").length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the compare CTA disabled until 2 programs are selected, then enables it", () => {
    render(<Recommendations />);
    expect(screen.getByRole("button", { name: "Сравнить выбранные" })).toBeDisabled();

    const cards = screen.getAllByRole("article");
    fireEvent.click(within(cards[0]).getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "Сравнить выбранные" })).toBeDisabled();

    fireEvent.click(within(cards[1]).getByRole("checkbox"));
    expect(screen.getByRole("link", { name: /Сравнить выбранные \(2\)/ })).toHaveAttribute(
      "href",
      "/compare",
    );
  });

  it("reveals the rest of the recommendations on 'show more'", () => {
    render(<Recommendations />);
    const initialCount = screen.getAllByRole("article").length;
    const more = screen.queryByRole("button", { name: /Показать ещё/ });
    if (more) {
      fireEvent.click(more);
      expect(screen.getAllByRole("article").length).toBeGreaterThan(initialCount);
    }
  });
});
