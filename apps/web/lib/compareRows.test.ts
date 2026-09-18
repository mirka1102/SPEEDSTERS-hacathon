import { describe, it, expect } from "vitest";
import { buildFactorRows, fitScoreCells } from "./compareRows";
import type { Recommendation } from "@shared/types";

function rec(overrides: Partial<Recommendation["program"]> & { fitScore?: number } = {}): Recommendation {
  const { fitScore = 80, ...programOverrides } = overrides;
  return {
    program: {
      id: "p1",
      university: "U",
      program: "BSc Testing",
      country: "US",
      city: "Testville",
      field: "cs",
      language: "en",
      tuitionUsdYear: 20000,
      livingUsdYear: 10000,
      scholarshipAvailable: false,
      scholarshipNote: null,
      gpaMin4: 3.5,
      ieltsMin: 6.5,
      toeflMin: null,
      satRequired: false,
      satMin: null,
      otherRequirements: [],
      selectivity: 2,
      applicationDeadline: "2027-01-01",
      intake: "Fall 2027",
      sourceUrl: "https://example.com",
      dataStatus: "verified",
      imageUrl: null,
      campusLifeNote: null,
      ...programOverrides,
    },
    factors: { field: 1, budget: 1, academic: 1, exams: 1, country: 1, language: 1 },
    fitScore,
    label: "match",
  };
}

describe("buildFactorRows", () => {
  it("orders rows to match the given weight order", () => {
    const rows = buildFactorRows([rec()], ["budget", "field", "academic", "exams", "country", "language"]);
    expect(rows.map((r) => r.key)).toEqual(["budget", "field", "academic", "exams", "country", "language"]);
  });

  it("highlights the cheaper program on the budget row", () => {
    const cheap = rec({ id: "cheap", tuitionUsdYear: 5000, livingUsdYear: 3000 });
    const pricey = rec({ id: "pricey", tuitionUsdYear: 40000, livingUsdYear: 20000 });
    const rows = buildFactorRows([cheap, pricey], ["budget"]);
    expect(rows[0].highlightIndex).toBe(0);
  });

  it("does not highlight a tie", () => {
    const a = rec({ id: "a", gpaMin4: 3.5 });
    const b = rec({ id: "b", gpaMin4: 3.5 });
    const rows = buildFactorRows([a, b], ["academic"]);
    expect(rows[0].highlightIndex).toBeNull();
  });

  it("does not highlight a qualitative row like country", () => {
    const rows = buildFactorRows([rec(), rec()], ["country"]);
    expect(rows[0].highlightIndex).toBeNull();
  });

  it("summarizes exam requirements from the program's own thresholds", () => {
    const withExams = rec({ ieltsMin: 6.5, satRequired: true, satMin: 1400 });
    const rows = buildFactorRows([withExams], ["exams"]);
    expect(rows[0].cells[0]).toBe("IELTS от 6.5, SAT от 1400");
  });
});

describe("fitScoreCells", () => {
  it("highlights the highest fit score", () => {
    const { cells, highlightIndex } = fitScoreCells([rec({ fitScore: 60 }), rec({ fitScore: 90 })]);
    expect(cells).toEqual(["60 / 100", "90 / 100"]);
    expect(highlightIndex).toBe(1);
  });
});
