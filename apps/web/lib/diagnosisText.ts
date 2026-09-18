import type { Diagnosis } from "@shared/types";
import { COUNTRY_NAMES, FIELD_NAMES, formatDate, INTAKE_PHRASES } from "./labels";

function strengthText(item: Diagnosis["strengths"][number]): string {
  switch (item.key) {
    case "field_match":
      return "Выбранное направление хорошо совпадает с программами в подборке.";
    case "budget_comfortable":
      return "Бюджет комфортно покрывает обучение и жизнь по большинству подходящих программ.";
    case "academic_strong":
      return "Средний балл (GPA) выше минимальных требований у большинства программ.";
    case "ielts_strong":
      return `Балл IELTS (${item.value}) уже закрывает языковые требования большинства программ.`;
    case "sat_strong":
      return `Балл SAT (${item.value}) уже закрывает требования большинства программ.`;
    case "exam_ready":
      return "Экзаменационные требования по большинству программ уже закрыты.";
    case "country_flexible":
      return "Открытость к разным странам расширяет число подходящих программ.";
    case "country_match":
      return "Отмеченные страны хорошо совпадают со странами в подборке.";
    case "language_ready":
      return "Уровень языка обучения уже достаточен для большинства программ.";
    default:
      return item.key;
  }
}

function limitationText(item: Diagnosis["limitations"][number]): string {
  switch (item.key) {
    case "no_sat":
      return "SAT ещё не сдан, а часть программ его требует.";
    case "budget_tight":
      return "Текущий бюджет ниже стоимости большинства подходящих программ.";
    case "gpa_below_median":
      return "Средний балл (GPA) ниже минимальных требований у большинства программ.";
    case "english_untested":
      return "Уровень английского пока нигде не подтверждён баллом.";
    case "late_timeline":
      return `Дедлайн подачи по одной из программ уже близко — ${formatDate(String(item.value))}.`;
    default:
      return item.key;
  }
}

export function strengthTexts(diagnosis: Diagnosis): string[] {
  return diagnosis.strengths.map(strengthText);
}

export function limitationTexts(diagnosis: Diagnosis): string[] {
  return diagnosis.limitations.map(limitationText);
}

/** Nominative-ish goal sentence built from structured facts (SPEC.md §5 diagnosis). */
export function goalSentence(goal: Diagnosis["goal"]): string {
  const fields = goal.fields.map((f) => FIELD_NAMES[f]).join(", ");
  const countries = goal.countries.map((c) => COUNTRY_NAMES[c]).join(", ");
  return `Цель: ${fields} · ${countries} · ${INTAKE_PHRASES[goal.intake]}.`;
}

/**
 * Plain templated diagnosis paragraph, built from the structured facts when no
 * `diagnosisText` from /api/explain is present (SPEC.md §6 fallback rule).
 */
export function buildDiagnosisText(diagnosis: Diagnosis): string {
  const { strengths, limitations, stats } = diagnosis;
  const strengthPart = strengths.length
    ? `Нашли ${strengths.length} сильн${strengths.length === 1 ? "ую сторону" : "ых стороны"} в твоём профиле.`
    : "Явных сильных сторон пока не нашлось — это нормально на старте.";
  const limitationPart = limitations.length
    ? `Есть ${limitations.length} момент${limitations.length === 1 ? "" : "а"}, над которыми стоит поработать.`
    : "Явных слабых мест не нашлось.";
  const statsPart = `Из ${stats.programsConsidered} рассмотренных программ подходит ${stats.programsFit}.`;
  return `${strengthPart} ${limitationPart} ${statsPart}`;
}

/** `diagnosisText` from /api/explain when present, else the templated fallback above. */
export function diagnosisTextFor(diagnosis: Diagnosis): string {
  return diagnosis.diagnosisText ?? buildDiagnosisText(diagnosis);
}
