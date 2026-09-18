"use client";

import type { Grade, Intake } from "@shared/types";
import { Question, SingleChoice, type Option } from "../fields";
import type { GroupProps } from "./types";

const GRADES: Option<Grade>[] = [
  { value: "9", label: "9 класс" },
  { value: "10", label: "10 класс" },
  { value: "11", label: "11 класс" },
  { value: "graduated", label: "Школа уже позади" },
];

const INTAKES: Option<Intake>[] = [
  { value: "Fall 2027", label: "Осень 2027" },
  { value: "Fall 2028", label: "Осень 2028" },
];

/** The nearest intake a student in this grade can realistically start at. */
export function intakeForGrade(grade: Grade): Intake {
  return grade === "11" || grade === "graduated" ? "Fall 2027" : "Fall 2028";
}

export function AboutYou({ answers, set }: GroupProps) {
  return (
    <>
      <Question
        title="В каком ты классе?"
        hint="От этого зависит, сколько времени у тебя реально осталось до дедлайнов."
      >
        <SingleChoice
          groupLabel="В каком ты классе?"
          value={answers.grade}
          options={GRADES}
          onChange={(grade) => set({ grade, intake: intakeForGrade(grade) })}
        />
      </Question>

      <Question
        title="Когда хочешь начать учёбу?"
        hint="Мы подставили ближайшую осень после выпуска. Если планируешь взять год на подготовку — поменяй."
      >
        <SingleChoice
          groupLabel="Когда хочешь начать учёбу?"
          value={answers.intake}
          options={INTAKES}
          onChange={(intake) => set({ intake })}
        />
      </Question>
    </>
  );
}
