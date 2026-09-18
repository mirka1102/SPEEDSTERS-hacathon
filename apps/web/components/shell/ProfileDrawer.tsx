"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MultiChoice, Question, SingleChoice } from "@/components/questionnaire/fields";
import { BUDGETS } from "@/components/questionnaire/groups/BudgetConstraints";
import { COUNTRIES, nextCountries } from "@/components/questionnaire/groups/Where";
import { EXAMS, ExamField } from "@/components/questionnaire/groups/ExamsLanguages";
import { useProfileStore } from "@/lib/store";

/**
 * SPEC.md §2: "Your profile" drawer, open from any screen from step 3
 * onward — edit budget, countries, or an exam score without leaving the
 * page, and the plan recomputes because every downstream screen derives
 * its plan from the same `answers` in the store. This is the one feature
 * PLAN.md calls out as the most jury-visible; it's a plain settings form,
 * not a re-run of the whole questionnaire.
 */
export function ProfileDrawer() {
  const { answers, setAnswers } = useProfileStore();

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="h-9 gap-1.5 px-3 text-[0.8125rem]" />}
      >
        <SlidersHorizontalIcon className="size-3.5" aria-hidden="true" />
        Профиль
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Твой профиль</SheetTitle>
          <SheetDescription>
            Поменяй бюджет, страны или баллы — подборка и план пересчитаются сразу.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-8 px-4 pb-4">
          <Question title="Бюджет в год">
            <SingleChoice
              groupLabel="Бюджет в год"
              value={answers.budgetUsdYear}
              options={BUDGETS}
              onChange={(budgetUsdYear) => setAnswers({ budgetUsdYear })}
            />
          </Question>

          <Question title="Страны">
            <MultiChoice
              values={answers.countries}
              options={COUNTRIES}
              onToggle={(country) =>
                setAnswers({ countries: nextCountries(answers.countries, country) })
              }
            />
          </Question>

          {EXAMS.map((config) => (
            <ExamField
              key={config.key}
              config={config}
              score={answers[config.key]}
              onChange={(next) => setAnswers({ [config.key]: next })}
            />
          ))}
        </div>

        <SheetFooter>
          <SheetClose render={<Button className="h-11" />}>Готово</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
