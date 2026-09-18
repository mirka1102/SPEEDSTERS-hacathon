import type { Country, Field, Intake, RoadmapPhase, TaskCategory } from "@shared/types";

/** Nominative Russian names for each field of study (SPEC.md §3). */
export const FIELD_NAMES: Record<Field, string> = {
  cs: "информатика и IT",
  eng: "инженерия",
  business: "бизнес и экономика",
  natsci: "естественные науки",
  design: "дизайн и искусство",
  undecided: "направление пока не выбрано",
};

/** Nominative Russian names for each destination country, plus the "any" option. */
export const COUNTRY_NAMES: Record<Country | "open_to_any", string> = {
  US: "США",
  UK: "Великобритания",
  DE: "Германия",
  KR: "Корея",
  TR: "Турция",
  open_to_any: "любая страна, если остальное подходит",
};

/** Human name for the language a program teaches in. */
export const LANGUAGE_NAMES: Record<"en" | "de" | "ko" | "tr", string> = {
  en: "английский",
  de: "немецкий",
  ko: "корейский",
  tr: "турецкий",
};

export const INTAKE_PHRASES: Record<Intake, string> = {
  "Fall 2027": "поступление к осени 2027 года",
  "Fall 2028": "поступление к осени 2028 года",
};

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("ru-RU")}`;
}

/** Roadmap task categories (SPEC.md §5). */
export const TASK_CATEGORY_NAMES: Record<TaskCategory, string> = {
  exam: "Экзамен",
  document: "Документы",
  deadline: "Дедлайн",
  academic: "Учёба",
  activity: "Активность",
  finance: "Финансы",
};

/** Roadmap phases, in display order (SPEC.md §5). */
export const ROADMAP_PHASE_ORDER: RoadmapPhase[] = ["now", "autumn", "winter", "spring", "after_submission"];

export const ROADMAP_PHASE_NAMES: Record<RoadmapPhase, string> = {
  now: "Сейчас",
  autumn: "Осенью",
  winter: "Зимой",
  spring: "Весной",
  after_submission: "После подачи",
};

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
