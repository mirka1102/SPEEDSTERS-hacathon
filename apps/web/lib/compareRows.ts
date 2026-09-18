import type { FactorScores, Recommendation } from "@shared/types";
import { formatUsd } from "./labels";

export type CompareRow = {
  key: keyof FactorScores;
  label: string;
  cells: string[];
  /** Index of the best cell for this row, or null when it isn't comparable / it's a tie. */
  highlightIndex: number | null;
};

const FACTOR_ROW_LABEL: Record<keyof FactorScores, string> = {
  field: "Программа",
  budget: "Стоимость в год",
  academic: "Мин. GPA",
  exams: "Экзамены",
  country: "Страна",
  language: "Язык обучения",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "США",
  UK: "Великобритания",
  DE: "Германия",
  KR: "Корея",
  TR: "Турция",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "английский",
  de: "немецкий",
  ko: "корейский",
  tr: "турецкий",
};

function examSummary(r: Recommendation): string {
  const parts: string[] = [];
  if (r.program.ieltsMin != null) parts.push(`IELTS от ${r.program.ieltsMin}`);
  if (r.program.toeflMin != null) parts.push(`TOEFL от ${r.program.toeflMin}`);
  if (r.program.satRequired) parts.push(`SAT${r.program.satMin ? ` от ${r.program.satMin}` : ""}`);
  return parts.length > 0 ? parts.join(", ") : "Не требуется";
}

function factorCell(key: keyof FactorScores, r: Recommendation): string {
  switch (key) {
    case "field":
      return r.program.program;
    case "budget":
      return formatUsd(r.program.tuitionUsdYear + r.program.livingUsdYear);
    case "academic":
      return r.program.gpaMin4.toFixed(1);
    case "exams":
      return examSummary(r);
    case "country":
      return `${r.program.city}, ${COUNTRY_NAMES[r.program.country] ?? r.program.country}`;
    case "language":
      return LANGUAGE_NAMES[r.program.language] ?? r.program.language;
  }
}

/** Only these two rows have a single objectively "better" cell; the rest are qualitative. */
const LOWER_IS_BETTER: Partial<Record<keyof FactorScores, (r: Recommendation) => number>> = {
  budget: (r) => r.program.tuitionUsdYear + r.program.livingUsdYear,
  academic: (r) => r.program.gpaMin4,
};

function bestIndex(key: keyof FactorScores, recommendations: Recommendation[]): number | null {
  const valueOf = LOWER_IS_BETTER[key];
  if (!valueOf) return null;
  const values = recommendations.map(valueOf);
  const best = Math.min(...values);
  if (values.every((v) => v === best)) return null;
  return values.indexOf(best);
}

/** One row per factor, in `weightOrder` (SPEC.md §5: "rows ordered by what this user weighted highest"). */
export function buildFactorRows(
  recommendations: Recommendation[],
  weightOrder: (keyof FactorScores)[],
): CompareRow[] {
  return weightOrder.map((key) => ({
    key,
    label: FACTOR_ROW_LABEL[key],
    cells: recommendations.map((r) => factorCell(key, r)),
    highlightIndex: bestIndex(key, recommendations),
  }));
}

export function fitScoreCells(recommendations: Recommendation[]): {
  cells: string[];
  highlightIndex: number | null;
} {
  const scores = recommendations.map((r) => r.fitScore);
  const best = Math.max(...scores);
  const tie = scores.every((s) => s === best);
  return {
    cells: scores.map((s) => `${s} / 100`),
    highlightIndex: tie ? null : scores.indexOf(best),
  };
}
