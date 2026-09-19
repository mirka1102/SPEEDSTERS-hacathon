"use client";

import { useState } from "react";
import Link from "next/link";
import { StepIndicator } from "@/components/shell/StepIndicator";
import { DataScreenSkeleton } from "@/components/shell/DataScreenSkeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/store";
import { JOURNEY_LABELS } from "@/lib/journey";
import { usePlan, useExplanation } from "@/lib/usePlanData";
import { ApiErrorNotice } from "@/components/shell/ApiErrorNotice";
import { ProgramCard } from "@/components/program/ProgramCard";

const VISIBLE_STEP = 3;
const MIN_TO_COMPARE = 2;
const MAX_TO_COMPARE = 3;

/**
 * Step 4 of SPEC.md §2: top picks first, "show more" reveals the rest of
 * whatever the engine returned. `rank` is always the position in the full
 * sorted list, not the visible slice, so revealing more never re-labels an
 * already-shown card as "top."
 */
export function Recommendations() {
  const { answers, selectedPrograms, setSelectedPrograms, favorites, toggleFavorite, hydrated } =
    useProfileStore();
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);
  const { plan, loading, error } = usePlan(answers);
  const explanation = useExplanation(plan);

  if (!hydrated || loading) return <DataScreenSkeleton />;

  const { recommendations } = plan;
  const visible = recommendations.slice(0, visibleCount);
  const hasMore = visibleCount < recommendations.length;
  const canCompare = selectedPrograms.length >= MIN_TO_COMPARE;

  const toggleSelect = (id: string) => {
    if (selectedPrograms.includes(id)) {
      setSelectedPrograms(selectedPrograms.filter((p) => p !== id));
    } else if (selectedPrograms.length < MAX_TO_COMPARE) {
      setSelectedPrograms([...selectedPrograms, id]);
    }
  };

  return (
    <div className="pt-6 pb-16 sm:pt-10">
      <StepIndicator current={4} total={JOURNEY_LABELS.length} labels={JOURNEY_LABELS} />
      <ApiErrorNotice message={error} />

      <h1 className="mt-9 text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
        Подходящие программы
      </h1>
      <p className="mt-2.5 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
        У каждой программы — оценка соответствия, категория Safety / Match / Reach и объяснение,
        почему она тебе подходит. Выбери 2–3, чтобы сравнить их рядом.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        {recommendations.length === 0 ? (
          <div className="rounded-xl border border-border p-6 text-center">
            <p className="text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
              По текущим ответам подходящих программ не нашлось. Попробуй расширить страны или
              бюджет в анкете.
            </p>
            <Link
              href="/profile"
              className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
            >
              Изменить анкету
            </Link>
          </div>
        ) : (
          visible.map((recommendation, index) => (
            <ProgramCard
              key={recommendation.program.id}
              recommendation={recommendation}
              rank={index + 1}
              onToggleFavorite={toggleFavorite}
              isFavorite={favorites.includes(recommendation.program.id)}
              onToggleSelect={toggleSelect}
              isSelected={selectedPrograms.includes(recommendation.program.id)}
              selectDisabled={
                selectedPrograms.length >= MAX_TO_COMPARE &&
                !selectedPrograms.includes(recommendation.program.id)
              }
              whyTextOverride={explanation.whyText[recommendation.program.id]}
            />
          ))
        )}
      </div>

      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="mt-6 h-10 w-full text-sm sm:w-auto"
          onClick={() => setVisibleCount(recommendations.length)}
        >
          Показать ещё {recommendations.length - visibleCount}
        </Button>
      ) : null}

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/diagnosis"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-[0.9375rem]")}
        >
          Назад к диагностике
        </Link>

        <div className="flex flex-col items-end gap-1.5 sm:ml-auto">
          {canCompare ? (
            <Link
              href="/compare"
              className={cn(buttonVariants(), "h-11 px-6 text-[0.9375rem] tracking-tight")}
            >
              Сравнить выбранные ({selectedPrograms.length})
            </Link>
          ) : (
            <Button type="button" className="h-11 px-6 text-[0.9375rem] tracking-tight" disabled>
              Сравнить выбранные
            </Button>
          )}
          <p className="text-[0.8125rem] text-muted-foreground">
            {canCompare
              ? `Выбрано ${selectedPrograms.length} из ${MAX_TO_COMPARE}.`
              : `Нужно выбрать ещё ${MIN_TO_COMPARE - selectedPrograms.length}, минимум ${MIN_TO_COMPARE}.`}
          </p>
        </div>
      </div>
    </div>
  );
}
