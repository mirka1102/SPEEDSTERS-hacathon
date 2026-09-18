import type { ComponentType } from "react";
import { Academics } from "./Academics";
import { AboutYou } from "./AboutYou";
import { BudgetConstraints } from "./BudgetConstraints";
import { Direction } from "./Direction";
import { ExamsLanguages } from "./ExamsLanguages";
import { Where } from "./Where";
import type { GroupProps } from "./types";

export type QuestionGroup = {
  /** Heading of the screen — the six groups of SPEC.md §3, in order. */
  title: string;
  /** One sentence under the heading saying why we ask this. */
  lead: string;
  Body: ComponentType<GroupProps>;
};

export const GROUPS: QuestionGroup[] = [
  {
    title: "О тебе",
    lead: "Два вопроса, чтобы понять, сколько времени у тебя осталось до дедлайнов.",
    Body: AboutYou,
  },
  {
    title: "Направление",
    lead: "Чему хочешь учиться. Отсюда начинается вся подборка.",
    Body: Direction,
  },
  {
    title: "Учёба",
    lead: "Как обстоят дела с оценками и достижениями прямо сейчас.",
    Body: Academics,
  },
  {
    title: "Экзамены и языки",
    lead: "Что уже сдано, что в процессе, а что ещё даже не начиналось.",
    Body: ExamsLanguages,
  },
  {
    title: "Куда",
    lead: "Страны и язык обучения — самый жёсткий фильтр из всех.",
    Body: Where,
  },
  {
    title: "Деньги и возможности",
    lead: "Последний блок. Обычно именно здесь и решается, куда реально можно поехать.",
    Body: BudgetConstraints,
  },
];

export type { GroupProps };
