import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StepIndicator } from "./StepIndicator";

describe("StepIndicator", () => {
  it("shows the current step number and its label", () => {
    render(
      <StepIndicator
        current={3}
        total={5}
        labels={[
          "Анкета",
          "Диагностика",
          "Рекомендации",
          "Сравнение",
          "План",
        ]}
      />,
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText("Рекомендации")).toBeInTheDocument();
  });
});
