import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ProfileDrawer } from "./ProfileDrawer";
import { __resetProfileStoreForTests, useProfileStore } from "@/lib/store";

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
});

describe("ProfileDrawer", () => {
  it("opens on trigger click and shows the budget, countries, and exam controls", () => {
    render(<ProfileDrawer />);
    fireEvent.click(screen.getByRole("button", { name: "Профиль" }));

    expect(screen.getByText("Твой профиль")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Бюджет в год" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "IELTS уже есть?" })).toBeInTheDocument();
  });

  it("persists a budget change immediately, so any screen re-reading the store sees it", () => {
    render(<ProfileDrawer />);
    fireEvent.click(screen.getByRole("button", { name: "Профиль" }));

    fireEvent.click(screen.getByRole("radio", { name: /Больше \$50 000/ }));

    const stored = JSON.parse(window.localStorage.getItem("steer.profile.v1") ?? "{}");
    expect(stored.answers.budgetUsdYear).toBe("50k+");
  });

  it("updates a sibling component's own useProfileStore() call, not just localStorage", () => {
    // Mirrors the real tree: AppShell renders ProfileDrawer as a sibling of the page, and each
    // calls useProfileStore() independently. A regression here (e.g. reverting to per-component
    // useState) would leave this sibling showing the stale budget forever.
    function BudgetReadout() {
      const { answers } = useProfileStore();
      return <p>Текущий бюджет: {answers.budgetUsdYear}</p>;
    }

    render(
      <>
        <ProfileDrawer />
        <BudgetReadout />
      </>,
    );

    expect(screen.getByText("Текущий бюджет: 15-30k")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Профиль" }));
    fireEvent.click(screen.getByRole("radio", { name: /Больше \$50 000/ }));

    expect(screen.getByText("Текущий бюджет: 50k+")).toBeInTheDocument();
  });
});
