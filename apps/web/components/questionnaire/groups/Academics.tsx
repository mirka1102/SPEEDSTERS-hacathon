"use client";

import type { Answers } from "@shared/types";
import { Slider } from "@/components/ui/slider";
import { Question, SingleChoice, type Option } from "../fields";
import type { GroupProps } from "./types";

type Achievements = Answers["achievements"];

const ACHIEVEMENTS: Option<Achievements>[] = [
  {
    value: "none",
    label: "Пока ничего",
    hint: "Это не приговор — в плане появятся олимпиады, до которых ещё можно успеть",
  },
  { value: "school", label: "Школьный уровень" },
  { value: "regional", label: "Городские или областные" },
  { value: "national", label: "Республиканские" },
  { value: "international", label: "Международные" },
];

const GPA_MIN = 3;
const GPA_MAX = 5;

function formatGpa(gpa: number) {
  return gpa.toFixed(1).replace(".", ",");
}

export function Academics({ answers, set }: GroupProps) {
  return (
    <>
      <Question
        title="Какой у тебя средний балл?"
        hint="По пятибалльной шкале, как в табеле. Точное значение до сотых не нужно — достаточно прикинуть."
      >
        <div className="rounded-xl border border-border px-4 py-5">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatGpa(answers.gpa)}
          </p>
          <Slider
            aria-label="Средний балл"
            className="mt-5"
            min={GPA_MIN}
            max={GPA_MAX}
            step={0.1}
            value={answers.gpa}
            onValueChange={(value) =>
              set({ gpa: Array.isArray(value) ? value[0] : value })
            }
          />
          <div className="mt-2.5 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>3,0</span>
            <span>5,0</span>
          </div>
        </div>
      </Question>

      <Question
        title="Есть олимпиады, конкурсы или награды?"
        hint="Считается самый высокий уровень из тех, что уже есть."
      >
        <SingleChoice
          groupLabel="Есть олимпиады, конкурсы или награды?"
          value={answers.achievements}
          options={ACHIEVEMENTS}
          onChange={(achievements) => set({ achievements })}
        />
      </Question>
    </>
  );
}
