"use client";

import Link from "next/link";
import { BookmarkIcon } from "lucide-react";
import { StepIndicator } from "@/components/shell/StepIndicator";
import { DataScreenSkeleton } from "@/components/shell/DataScreenSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/store";
import { JOURNEY_LABELS } from "@/lib/journey";
import { usePlan, usePrograms } from "@/lib/usePlanData";
import { ApiErrorNotice } from "@/components/shell/ApiErrorNotice";
import { formatDate, formatUsd } from "@/lib/labels";
import { whyTextFor } from "@/lib/whyText";
import { LabelBadge } from "./LabelBadge";
import { SourceBadge } from "./SourceBadge";
import { ScholarshipBadge } from "./ScholarshipBadge";
import { FactorBars } from "./FactorBars";
import { CampusLifeCard } from "./CampusLifeCard";

const COUNTRY_NAMES: Record<string, string> = {
  US: "США",
  UK: "Великобритания",
  DE: "Германия",
  KR: "Корея",
  TR: "Турция",
};

/**
 * SPEC.md §10: the fuller render of a `Program` — photo/campus-life note,
 * full requirement/cost breakdown, scholarship detail, sources. Reuses the
 * same `Program` object already fetched for Recommendations/Compare; when
 * this program happens to also be one of the user's current recommendations,
 * the fit score/label/why also show, but the page works standalone too
 * (e.g. reached from Favorites for a program no longer in the top picks).
 */
export function ProgramDetail({ id }: { id: string }) {
  const { answers, favorites, toggleFavorite, hydrated } = useProfileStore();
  const { programs, loading: programsLoading, error: programsError } = usePrograms();
  const { plan, loading: planLoading, error: planError } = usePlan(answers);

  if (!hydrated || programsLoading || planLoading) return <DataScreenSkeleton />;

  const program = programs.find((p) => p.id === id);

  if (!program) {
    return (
      <div className="pt-6 pb-16 sm:pt-10">
        <h1 className="text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
          Программа не найдена
        </h1>
        <ApiErrorNotice message={programsError} />
        <Link
          href="/recommendations"
          className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
        >
          К рекомендациям
        </Link>
      </div>
    );
  }

  const recommendation = plan.recommendations.find((r) => r.program.id === id);
  const isFavorite = favorites.includes(program.id);
  const costSource = program.dataStatus === "demo" ? "demo" : program.sourceUrl;
  const countryName = COUNTRY_NAMES[program.country] ?? program.country;

  return (
    <div className="pt-6 pb-16 sm:pt-10">
      <StepIndicator current={4} total={JOURNEY_LABELS.length} labels={JOURNEY_LABELS} />
      <ApiErrorNotice message={planError} />

      <div className="mt-9 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
            {program.university}
          </h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">
            {program.program} · {program.city}, {countryName}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {recommendation ? <LabelBadge label={recommendation.label} /> : null}
            <ScholarshipBadge available={program.scholarshipAvailable} />
          </div>
        </div>
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          onClick={() => toggleFavorite(program.id)}
          className="shrink-0 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <BookmarkIcon
            className={cn("size-6", isFavorite && "fill-primary text-primary")}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="mt-6">
        <CampusLifeCard imageUrl={program.imageUrl} campusLifeNote={program.campusLifeNote} city={program.city} />
      </div>

      {recommendation ? (
        <div className="mt-6 rounded-xl border border-border p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[0.9375rem] leading-relaxed text-pretty">{whyTextFor(recommendation)}</p>
            <span className="ml-4 shrink-0 text-2xl font-bold tabular-nums">{recommendation.fitScore}</span>
          </div>
          <FactorBars factors={recommendation.factors} className="mt-4" />
        </div>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-[0.6875rem] text-muted-foreground">Стоимость в год</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.9375rem] font-semibold tabular-nums">
            {formatUsd(program.tuitionUsdYear + program.livingUsdYear)}
            <SourceBadge sourceUrl={costSource} />
          </dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-muted-foreground">Мин. GPA</dt>
          <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums">{program.gpaMin4.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] text-muted-foreground">Язык обучения</dt>
          <dd className="mt-1 text-[0.9375rem] font-semibold">
            {{ en: "английский", de: "немецкий", ko: "корейский", tr: "турецкий" }[program.language]}
          </dd>
        </div>
        {program.ieltsMin != null ? (
          <div>
            <dt className="text-[0.6875rem] text-muted-foreground">IELTS от</dt>
            <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums">{program.ieltsMin}</dd>
          </div>
        ) : null}
        {program.toeflMin != null ? (
          <div>
            <dt className="text-[0.6875rem] text-muted-foreground">TOEFL от</dt>
            <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums">{program.toeflMin}</dd>
          </div>
        ) : null}
        {program.satRequired ? (
          <div>
            <dt className="text-[0.6875rem] text-muted-foreground">SAT</dt>
            <dd className="mt-1 text-[0.9375rem] font-semibold tabular-nums">
              {program.satMin ? `от ${program.satMin}` : "требуется"}
            </dd>
          </div>
        ) : null}
        {program.otherRequirements.length > 0 ? (
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-[0.6875rem] text-muted-foreground">Другие требования</dt>
            <dd className="mt-1 text-[0.9375rem] font-semibold">{program.otherRequirements.join(", ")}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[0.6875rem] text-muted-foreground">Дедлайн подачи</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.9375rem] font-semibold">
            {formatDate(program.applicationDeadline)}
            <SourceBadge sourceUrl={costSource} />
          </dd>
        </div>
        {program.scholarshipAvailable ? (
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-[0.6875rem] text-muted-foreground">Стипендия</dt>
            <dd className="mt-1 text-[0.9375rem] leading-relaxed text-pretty">
              {program.scholarshipNote ?? "Доступна, детали уточняются."}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-10 border-t border-border pt-6">
        <Link
          href="/recommendations"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-[0.9375rem]")}
        >
          К рекомендациям
        </Link>
      </div>
    </div>
  );
}
