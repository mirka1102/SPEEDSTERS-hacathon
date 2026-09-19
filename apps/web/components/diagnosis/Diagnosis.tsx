"use client";

import Link from "next/link";
import { StepIndicator } from "@/components/shell/StepIndicator";
import { DataScreenSkeleton } from "@/components/shell/DataScreenSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/store";
import { JOURNEY_LABELS } from "@/lib/journey";
import { usePlan, useExplanation } from "@/lib/usePlanData";
import { ApiErrorNotice } from "@/components/shell/ApiErrorNotice";
import { formatUsd } from "@/lib/labels";
import { diagnosisTextFor, goalSentence, limitationTexts, strengthTexts } from "@/lib/diagnosisText";

/**
 * Step 3 of SPEC.md §2: a structured read of where the student stands today —
 * strengths, limitations, and the goal they answered — before any program
 * names appear. Nothing here is phrased by an LLM yet, so every sentence
 * comes straight from the engine's facts (SPEC.md §5/§6 fallback rule).
 */
export function Diagnosis() {
  const { answers, hydrated } = useProfileStore();
  const { plan, loading, error } = usePlan(answers);
  const explanation = useExplanation(plan);

  if (!hydrated || loading) return <DataScreenSkeleton />;

  const { diagnosis } = plan;
  const strengths = strengthTexts(diagnosis);
  const limitations = limitationTexts(diagnosis);
  const diagnosisParagraph = explanation.diagnosisText ?? diagnosisTextFor(diagnosis);

  return (
    <div className="pt-6 pb-16 sm:pt-10">
      <StepIndicator current={3} total={JOURNEY_LABELS.length} labels={JOURNEY_LABELS} />
      <ApiErrorNotice message={error} />

      <h1 className="mt-9 text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
        Твоя диагностика
      </h1>
      <p className="mt-2.5 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
        {diagnosisParagraph}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-accent px-4 py-3.5">
        <p className="text-[0.9375rem] leading-relaxed text-accent-foreground text-pretty">
          {goalSentence(diagnosis.goal)}
        </p>
        <Link
          href="/profile"
          className="shrink-0 text-sm font-medium text-primary underline underline-offset-4"
        >
          Изменить
        </Link>
      </div>

      <div className="mt-9 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold tracking-tight text-label-safety">
            Что уже в плюс
          </h2>
          {strengths.length > 0 ? (
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-pretty">
              {strengths.map((text) => (
                <li key={text} className="flex gap-2">
                  <span aria-hidden="true" className="text-label-safety">+</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
              Пока рано говорить о явных сильных сторонах — это нормально на старте.
            </p>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold tracking-tight text-label-reach">
            Над чем стоит поработать
          </h2>
          {limitations.length > 0 ? (
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-pretty">
              {limitations.map((text) => (
                <li key={text} className="flex gap-2">
                  <span aria-hidden="true" className="text-label-reach">–</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
              Явных слабых мест не нашлось — хороший знак.
            </p>
          )}
        </section>
      </div>

      <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
        <div>
          <dt className="text-[0.6875rem] text-muted-foreground">Рассмотрено</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">
            {diagnosis.stats.programsConsidered}
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-muted-foreground">Подходит</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{diagnosis.stats.programsFit}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-muted-foreground">От, /год</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">
            {diagnosis.stats.cheapestFitCostUsd != null
              ? formatUsd(diagnosis.stats.cheapestFitCostUsd)
              : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/profile"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-[0.9375rem]")}
        >
          Назад к анкете
        </Link>
        <Link
          href="/recommendations"
          className={cn(buttonVariants(), "h-11 px-6 text-[0.9375rem] tracking-tight sm:ml-auto")}
        >
          Смотреть рекомендации
        </Link>
      </div>
    </div>
  );
}
