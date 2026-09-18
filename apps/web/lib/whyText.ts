import type { FactorScores, Recommendation } from "@shared/types";
import { formatUsd, LANGUAGE_NAMES } from "./labels";

const FACTOR_ORDER: (keyof FactorScores)[] = [
  "field",
  "budget",
  "academic",
  "exams",
  "country",
  "language",
];

/** Short noun phrase used in the positive half of the sentence ("Подходит по X и Y"). */
const POSITIVE_PHRASE: Record<keyof FactorScores, string> = {
  field: "направлению",
  budget: "бюджету",
  academic: "оценкам",
  exams: "экзаменам",
  country: "стране",
  language: "языку обучения",
};

/**
 * The caveat clause naming the *specific* limiting factor, grounded in the
 * program's own numbers (not a generic "something doesn't match"). We don't
 * have the raw Answers here — only the Recommendation — so we compare against
 * what the program itself requires, which is exactly the honest thing to say:
 * "this program's usual bar," not a guess at the gap.
 */
function caveatFor(key: keyof FactorScores, recommendation: Recommendation): string {
  const { program } = recommendation;
  switch (key) {
    case "exams": {
      if (program.satRequired) {
        return "но твой балл SAT пока ниже, чем эта программа обычно ожидает";
      }
      if (program.ieltsMin != null) {
        return `но для неё обычно нужен IELTS от ${program.ieltsMin}, а этот балл ещё предстоит подтвердить`;
      }
      if (program.toeflMin != null) {
        return `но для неё обычно нужен TOEFL от ${program.toeflMin}, а этот балл ещё предстоит подтвердить`;
      }
      return "но экзаменационные требования по ней пока не закрыты";
    }
    case "budget":
      return `но год обучения и жизни здесь обходится примерно в ${formatUsd(
        program.tuitionUsdYear + program.livingUsdYear,
      )} — это может быть выше твоего бюджета`;
    case "academic":
      return `но сюда обычно проходят со средним баллом (GPA) от ${program.gpaMin4.toFixed(1)}, а твой пока ниже`;
    case "field":
      return "но направление подходит лишь приблизительно, не в точку";
    case "country":
      return "но эта страна не входила в число тех, что ты отметил как приоритетные";
    case "language":
      return `но обучение здесь идёт на ${LANGUAGE_NAMES[program.language]}, а это пока не самый крепкий твой язык`;
  }
}

/**
 * Plain templated "why it fits" sentence, built from the factor scores when
 * no `whyText` from /api/explain is present. Names the two strongest factors
 * and, if there's a real weak spot, the specific limiting factor — never a
 * generic "good match" with no substance behind it.
 */
export function buildWhyText(recommendation: Recommendation): string {
  const { factors } = recommendation;
  const sorted = [...FACTOR_ORDER].sort((a, b) => factors[a] - factors[b]);
  const lowest = sorted[0];
  const strongest = [...FACTOR_ORDER]
    .filter((key) => key !== lowest)
    .sort((a, b) => factors[b] - factors[a]);

  if (factors[lowest] >= 0.8) {
    const [first, second, third] = strongest;
    return `Хорошо подходит по нескольким ключевым параметрам сразу: ${POSITIVE_PHRASE[first]}, ${POSITIVE_PHRASE[second]} и ${POSITIVE_PHRASE[third]}.`;
  }

  const [first, second] = strongest;
  return `Подходит по ${POSITIVE_PHRASE[first]} и ${POSITIVE_PHRASE[second]}, ${caveatFor(lowest, recommendation)}.`;
}

/** `whyText` from /api/explain when present, else the templated fallback above. */
export function whyTextFor(recommendation: Recommendation): string {
  return recommendation.whyText ?? buildWhyText(recommendation);
}
