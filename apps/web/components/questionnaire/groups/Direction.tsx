"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import type { Field } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiChoice, Question, type Option } from "../fields";
import type { GroupProps } from "./types";

const MAX_FIELDS = 2;

const FIELDS: Option<Field>[] = [
  {
    value: "cs",
    label: "Информатика и IT",
    hint: "Разработка, данные, искусственный интеллект",
  },
  {
    value: "eng",
    label: "Инженерия",
    hint: "Механика, электроника, строительство, энергетика",
  },
  {
    value: "business",
    label: "Бизнес и экономика",
    hint: "Менеджмент, финансы, маркетинг",
  },
  {
    value: "natsci",
    label: "Естественные науки",
    hint: "Математика, физика, химия, биология",
  },
  {
    value: "design",
    label: "Дизайн и искусство",
    hint: "Графика, архитектура, медиа",
  },
  {
    value: "undecided",
    label: "Пока не знаю",
    hint: "Нормальный ответ. Подборка будет шире, а в плане появится шаг, как определиться",
  },
];

/**
 * Max two fields, and never an empty answer: picking a third drops the oldest,
 * unpicking the last one falls back to «пока не знаю» rather than blocking.
 */
export function nextFields(current: Field[], clicked: Field): Field[] {
  if (clicked === "undecided") return ["undecided"];

  const real = current.filter((field) => field !== "undecided");
  const without = real.filter((field) => field !== clicked);
  const next = without.length === real.length ? [...real, clicked].slice(-MAX_FIELDS) : without;

  return next.length > 0 ? next : ["undecided"];
}

export function Direction({ answers, set }: GroupProps) {
  const [draft, setDraft] = useState("");

  const addInterest = () => {
    const tag = draft.trim();
    if (!tag || answers.interests.includes(tag)) {
      setDraft("");
      return;
    }
    set({ interests: [...answers.interests, tag] });
    setDraft("");
  };

  return (
    <>
      <Question
        title="В какой области хочешь учиться?"
        hint="Можно выбрать до двух — так подборка будет точнее. Если выберешь третью, самая ранняя снимется."
      >
        <MultiChoice
          values={answers.fields}
          options={FIELDS}
          onToggle={(field) => set({ fields: nextFields(answers.fields, field) })}
        />
      </Question>

      <Question
        title="Что тебе интересно помимо школьных предметов?"
        hint="Необязательно. Пара тем — например, робототехника, кино или экология — помогает нам объяснять рекомендации твоими словами."
      >
        <div className="flex gap-2">
          <Input
            aria-label="Добавить интерес"
            className="h-11 flex-1"
            placeholder="Например, робототехника"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addInterest();
              }
            }}
          />
          <Button type="button" variant="outline" className="h-11 px-4" onClick={addInterest}>
            Добавить
          </Button>
        </div>

        {answers.interests.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {answers.interests.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  aria-label={`Убрать «${tag}»`}
                  className="flex items-center gap-1.5 rounded-lg border border-border py-1.5 pr-2 pl-2.5 text-[0.8125rem] font-medium transition-colors hover:bg-muted"
                  onClick={() =>
                    set({ interests: answers.interests.filter((item) => item !== tag) })
                  }
                >
                  {tag}
                  <XIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Question>
    </>
  );
}
