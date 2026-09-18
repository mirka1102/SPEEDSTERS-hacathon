import { describe, it, expect } from "vitest";
import { buildDiagnosisText, goalSentence, limitationTexts, strengthTexts } from "./diagnosisText";
import type { Diagnosis } from "@shared/types";

function baseDiagnosis(overrides: Partial<Diagnosis> = {}): Diagnosis {
  return {
    strengths: [],
    limitations: [],
    goal: { fields: ["cs"], countries: ["US"], intake: "Fall 2027" },
    stats: { programsConsidered: 25, programsFit: 5, cheapestFitCostUsd: 12000 },
    ...overrides,
  };
}

describe("goalSentence", () => {
  it("names the fields, countries, and intake in one sentence", () => {
    const sentence = goalSentence(baseDiagnosis().goal);
    expect(sentence).toContain("США");
    expect(sentence).toContain("осени 2027");
  });
});

describe("strengthTexts / limitationTexts", () => {
  it("renders a value-carrying key with the actual value inline", () => {
    const diagnosis = baseDiagnosis({ strengths: [{ key: "ielts_strong", value: 7.5 }] });
    expect(strengthTexts(diagnosis)[0]).toContain("7.5");
  });

  it("renders a date-carrying limitation with a formatted date", () => {
    const diagnosis = baseDiagnosis({ limitations: [{ key: "late_timeline", value: "2027-01-15" }] });
    expect(limitationTexts(diagnosis)[0]).toContain("2027");
  });
});

describe("buildDiagnosisText", () => {
  it("falls back to a neutral sentence when there are no strengths or limitations", () => {
    const text = buildDiagnosisText(baseDiagnosis());
    expect(text).toContain("не нашлось");
    expect(text).toContain("25");
  });

  it("counts strengths and limitations when present", () => {
    const diagnosis = baseDiagnosis({
      strengths: [{ key: "field_match" }, { key: "budget_comfortable" }],
      limitations: [{ key: "no_sat" }],
    });
    const text = buildDiagnosisText(diagnosis);
    expect(text).toContain("2 сильных стороны");
    expect(text).toContain("1 момент");
  });
});
