"use client";

import type { Activity, Answers, BudgetBand, ScholarshipNeed } from "@shared/types";
import { MultiChoice, Question, SingleChoice, type Option } from "../fields";
import type { GroupProps } from "./types";

type Hours = Answers["hoursPerWeek"];

export const BUDGETS: Option<BudgetBand>[] = [
  { value: "<5k", label: "До $5 000" },
  { value: "5-15k", label: "$5 000 — 15 000" },
  { value: "15-30k", label: "$15 000 — 30 000" },
  { value: "30-50k", label: "$30 000 — 50 000" },
  { value: "50k+", label: "Больше $50 000" },
];

const SCHOLARSHIP: Option<ScholarshipNeed>[] = [
  {
    value: "essential",
    label: "Без неё не получится",
    hint: "Тогда программы со стипендиями и грантами поднимутся в подборке наверх",
  },
  { value: "preferred", label: "Хорошо бы, но не критично" },
  { value: "not_needed", label: "Не нужна" },
];

const ACTIVITIES: Option<Activity>[] = [
  { value: "volunteering", label: "Волонтёрство" },
  { value: "sports", label: "Спорт" },
  { value: "clubs", label: "Кружки, клубы, школьные организации" },
  { value: "projects", label: "Свои проекты", hint: "Сайты, исследования, музыка, видео" },
  { value: "work", label: "Работа или стажировка" },
  {
    value: "none",
    label: "Пока ничем",
    hint: "Тоже ответ — в плане появятся шаги, с чего начать",
  },
];

const HOURS: Option<string>[] = [
  { value: "2", label: "Пара часов" },
  { value: "5", label: "Около пяти часов" },
  { value: "10", label: "Около десяти часов" },
  { value: "15", label: "Пятнадцать и больше" },
];

/** «Пока ничем» is exclusive, and an empty answer falls back to it. */
export function nextActivities(current: Activity[], clicked: Activity): Activity[] {
  if (clicked === "none") return ["none"];

  const real = current.filter((activity) => activity !== "none");
  const next = real.includes(clicked)
    ? real.filter((activity) => activity !== clicked)
    : [...real, clicked];

  return next.length > 0 ? next : ["none"];
}

export function BudgetConstraints({ answers, set }: GroupProps) {
  return (
    <>
      <Question
        title="Сколько семья готова тратить на учёбу в год?"
        hint="В долларах и вместе с жильём и едой. Точную сумму никто не знает — выбери близкий диапазон."
      >
        <SingleChoice
          groupLabel="Сколько семья готова тратить на учёбу в год?"
          value={answers.budgetUsdYear}
          options={BUDGETS}
          onChange={(budgetUsdYear) => set({ budgetUsdYear })}
        />
      </Question>

      <Question
        title="Насколько тебе нужна стипендия?"
        hint="От этого зависит, что мы считаем подходящей программой, а что — слишком дорогой."
      >
        <SingleChoice
          groupLabel="Насколько тебе нужна стипендия?"
          value={answers.scholarshipNeed}
          options={SCHOLARSHIP}
          onChange={(scholarshipNeed) => set({ scholarshipNeed })}
        />
      </Question>

      <Question
        title="Чем занимаешься кроме уроков?"
        hint="Университеты смотрят не только на оценки. Отметь всё, что есть — остальное станет шагами в плане."
      >
        <MultiChoice
          values={answers.activities}
          options={ACTIVITIES}
          onToggle={(activity) => set({ activities: nextActivities(answers.activities, activity) })}
        />
      </Question>

      <Question
        title="Сколько времени в неделю сможешь отдавать поступлению?"
        hint="План с датами подстроится под твой темп, а не под идеальный."
      >
        <SingleChoice
          groupLabel="Сколько времени в неделю сможешь отдавать поступлению?"
          value={String(answers.hoursPerWeek)}
          options={HOURS}
          onChange={(hours) => set({ hoursPerWeek: Number(hours) as Hours })}
        />
      </Question>
    </>
  );
}
