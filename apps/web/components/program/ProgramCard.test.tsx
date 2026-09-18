import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgramCard } from "./ProgramCard";
import type { Recommendation } from "@shared/types";

const sample: Recommendation = {
  program: {
    id: "test-1", university: "Test University", program: "BSc Testing", country: "US",
    city: "Testville", field: "cs", language: "en", tuitionUsdYear: 20000, livingUsdYear: 10000,
    scholarshipAvailable: false, scholarshipNote: null, gpaMin4: 3.0, ieltsMin: 6.0,
    toeflMin: 80, satRequired: false, satMin: null, otherRequirements: [], selectivity: 2,
    applicationDeadline: "2027-01-01", intake: "Fall 2027", sourceUrl: "https://example.com",
    dataStatus: "verified", imageUrl: null, campusLifeNote: null,
  },
  factors: { field: 1, budget: 0.8, academic: 0.9, exams: 0.7, country: 1, language: 1 },
  fitScore: 87,
  label: "match",
};

describe("ProgramCard", () => {
  it("shows the university name, fit score, and label", () => {
    render(<ProgramCard recommendation={sample} rank={1} />);
    expect(screen.getByText("Test University")).toBeInTheDocument();
    expect(screen.getByText(/87/)).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();
  });

  it("shows a source link when sourceUrl is a real url", () => {
    render(<ProgramCard recommendation={sample} rank={2} />);
    expect(screen.getByRole("link", { name: /source|example.com/i })).toBeInTheDocument();
  });

  it("shows a demo badge when dataStatus/sourceUrl indicate demo data", () => {
    const demoSample = { ...sample, program: { ...sample.program, sourceUrl: "demo" as const } };
    render(<ProgramCard recommendation={demoSample} rank={2} />);
    expect(screen.getByText(/demo/i)).toBeInTheDocument();
  });
});
