"use client";

import { useState } from "react";
import type { Answers, EnglishSelf, ExamScore } from "@shared/types";
import { Input } from "@/components/ui/input";
import { ChipChoice, Question, SingleChoice, type Option } from "../fields";
import type { GroupProps } from "./types";

type ExamMode = "value" | "planning" | "none";
type ExamKey = "ielts" | "toefl" | "sat";
type OtherLanguage = Answers["otherLanguages"][number];
type LanguageLevel = OtherLanguage["level"];

export type ExamConfig = {
  key: ExamKey;
  name: string;
  title: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  typical: number;
};

export const EXAMS: ExamConfig[] = [
  {
    key: "ielts",
    name: "IELTS",
    title: "IELTS уже есть?",
    hint: "Если только собираешься сдавать — отметь это: экзамен попадёт в план с датой, к которой его стоит закрыть.",
    min: 0,
    max: 9,
    step: 0.5,
    typical: 6.5,
  },
  {
    key: "toefl",
    name: "TOEFL",
    title: "А TOEFL?",
    hint: "Обычно сдают что-то одно из двух — это нормально.",
    min: 0,
    max: 120,
    step: 1,
    typical: 90,
  },
  {
    key: "sat",
    name: "SAT",
    title: "Что с SAT?",
    hint: "Нужен в основном для США. В Германии, Корее и Турции его чаще всего не спрашивают.",
    min: 400,
    max: 1600,
    step: 10,
    typical: 1250,
  },
];

const ENGLISH_LEVELS: Option<EnglishSelf>[] = [
  { value: "A2", label: "A2 — базовый", hint: "Понимаю простые тексты и короткие разговоры" },
  { value: "B1", label: "B1 — средний", hint: "Могу объясниться и читать несложные статьи" },
  { value: "B2", label: "B2 — уверенный", hint: "Свободно читаю и говорю на общие темы" },
  {
    value: "C1",
    label: "C1 — продвинутый",
    hint: "Спокойно читаю учебные тексты и пишу эссе",
  },
];

const LANGUAGES: { code: OtherLanguage["language"]; label: string }[] = [
  { code: "de", label: "Немецкий" },
  { code: "ko", label: "Корейский" },
  { code: "tr", label: "Турецкий" },
];

const LEVELS: LanguageLevel[] = ["A1", "A2", "B1", "B2", "C1"];

function modeOf(score: ExamScore | null): ExamMode {
  if (score == null) return "none";
  if ("value" in score) return "value";
  return score.status === "planning" ? "planning" : "none";
}

/** True once the student has an actual English score — that's when we stop guessing. */
function hasScore(score: ExamScore | null): boolean {
  return score != null && "value" in score;
}

export function ExamField({
  config,
  score,
  onChange,
}: {
  config: ExamConfig;
  score: ExamScore | null;
  onChange: (next: ExamScore) => void;
}) {
  const mode = modeOf(score);
  const stored = score != null && "value" in score ? score.value : config.typical;
  const [draft, setDraft] = useState(String(stored));

  const modes: Option<ExamMode>[] = [
    { value: "value", label: "Есть балл" },
    { value: "planning", label: "Готовлюсь" },
    { value: "none", label: "Пока нет" },
  ];

  const selectMode = (next: ExamMode) => {
    if (next === "value") {
      const parsed = Number(draft);
      const value = Number.isFinite(parsed) && draft !== "" ? parsed : config.typical;
      setDraft(String(value));
      onChange({ value });
      return;
    }
    onChange({ status: next });
  };

  return (
    <Question title={config.title} hint={config.hint}>
      <SingleChoice
        groupLabel={config.title}
        value={mode}
        options={modes}
        onChange={selectMode}
      />

      {mode === "value" ? (
        <div className="mt-3 rounded-xl border border-border px-4 py-4">
          <label
            htmlFor={`${config.key}-score`}
            className="block text-[0.8125rem] font-medium"
          >
            Балл {config.name}
          </label>
          <Input
            id={`${config.key}-score`}
            type="number"
            inputMode="decimal"
            className="mt-2 h-11 w-32 tabular-nums"
            min={config.min}
            max={config.max}
            step={config.step}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              const parsed = Number(event.target.value);
              if (event.target.value !== "" && Number.isFinite(parsed)) {
                onChange({ value: parsed });
              }
            }}
            onBlur={() => setDraft(String(stored))}
          />
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Мы подставили типичный балл — поставь свой.
          </p>
        </div>
      ) : null}
    </Question>
  );
}

function levelOf(languages: OtherLanguage[], code: OtherLanguage["language"]) {
  return languages.find((item) => item.language === code)?.level ?? "none";
}

export function ExamsLanguages({ answers, set }: GroupProps) {
  const needsSelfAssessment = !hasScore(answers.ielts) && !hasScore(answers.toefl);

  const setLevel = (code: OtherLanguage["language"], level: LanguageLevel | "none") => {
    const rest = answers.otherLanguages.filter((item) => item.language !== code);
    set({
      otherLanguages: level === "none" ? rest : [...rest, { language: code, level }],
    });
  };

  return (
    <>
      {EXAMS.map((config) => (
        <ExamField
          key={config.key}
          config={config}
          score={answers[config.key]}
          onChange={(next) => set({ [config.key]: next } as Partial<Answers>)}
        />
      ))}

      {needsSelfAssessment ? (
        <Question
          title="Как оцениваешь свой английский?"
          hint="Пока нет балла за экзамен, мы ориентируемся на твою оценку — потом её заменит настоящий результат."
        >
          <SingleChoice
            groupLabel="Как оцениваешь свой английский?"
            value={answers.englishSelf ?? "B2"}
            options={ENGLISH_LEVELS}
            onChange={(englishSelf) => set({ englishSelf })}
          />
        </Question>
      ) : null}

      <Question
        title="Знаешь другие языки?"
        hint="Немецкий, корейский и турецкий открывают программы, где учёба стоит копейки или вообще бесплатна. Не знаешь — просто оставь «нет»."
      >
        <div className="grid gap-4">
          {LANGUAGES.map(({ code, label }) => (
            <div key={code}>
              <p className="text-[0.9375rem] font-medium tracking-tight">{label}</p>
              <div className="mt-2">
                <ChipChoice
                  groupLabel={`Уровень: ${label.toLowerCase()}`}
                  value={levelOf(answers.otherLanguages, code)}
                  options={[
                    { value: "none", label: "Нет" },
                    ...LEVELS.map((level) => ({ value: level, label: level })),
                  ]}
                  onChange={(level) => setLevel(code, level as LanguageLevel | "none")}
                />
              </div>
            </div>
          ))}
        </div>
      </Question>
    </>
  );
}
