"use client";

import type { Country, StudyLanguage } from "@shared/types";
import { MultiChoice, Question, SingleChoice, type Option } from "../fields";
import type { GroupProps } from "./types";

type CountryChoice = Country | "open_to_any";

export const COUNTRIES: Option<CountryChoice>[] = [
  { value: "US", label: "США" },
  { value: "UK", label: "Великобритания" },
  { value: "DE", label: "Германия" },
  { value: "KR", label: "Южная Корея" },
  { value: "TR", label: "Турция" },
  {
    value: "open_to_any",
    label: "Страна не принципиальна",
    hint: "Смотрим на программу и деньги, а не на флаг",
  },
];

const STUDY_LANGUAGES: Option<StudyLanguage>[] = [
  {
    value: "english_only",
    label: "Только на английском",
    hint: "Программы на других языках сразу уберём из подборки",
  },
  {
    value: "open_to_learning",
    label: "Могу выучить местный язык",
    hint: "Это открывает самые дешёвые программы — например, бесплатные в Германии",
  },
];

/**
 * «Страна не принципиальна» is exclusive, and the answer never goes empty:
 * unpicking the last country falls back to it instead of blocking the student.
 */
export function nextCountries(
  current: CountryChoice[],
  clicked: CountryChoice,
): CountryChoice[] {
  if (clicked === "open_to_any") return ["open_to_any"];

  const real = current.filter((country) => country !== "open_to_any");
  const next = real.includes(clicked)
    ? real.filter((country) => country !== clicked)
    : [...real, clicked];

  return next.length > 0 ? next : ["open_to_any"];
}

export function Where({ answers, set }: GroupProps) {
  return (
    <>
      <Question
        title="В какие страны смотришь?"
        hint="Можно отметить несколько. Сейчас в базе США, Великобритания, Германия, Южная Корея и Турция — они сильно отличаются по цене и экзаменам."
      >
        <MultiChoice
          values={answers.countries}
          options={COUNTRIES}
          onToggle={(country) => set({ countries: nextCountries(answers.countries, country) })}
        />
      </Question>

      <Question
        title="На каком языке будешь учиться?"
        hint="Это жёсткий фильтр: если только английский — программы на немецком, корейском и турецком в подборку не попадут."
      >
        <SingleChoice
          groupLabel="На каком языке будешь учиться?"
          value={answers.studyLanguage}
          options={STUDY_LANGUAGES}
          onChange={(studyLanguage) => set({ studyLanguage })}
        />
      </Question>
    </>
  );
}
