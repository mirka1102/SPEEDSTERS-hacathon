"use client";

import Link from "next/link";
import { BookmarkIcon, CheckIcon } from "lucide-react";
import type { Recommendation } from "@shared/types";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/labels";
import { whyTextFor } from "@/lib/whyText";
import { LabelBadge } from "./LabelBadge";
import { SourceBadge } from "./SourceBadge";
import { ScholarshipBadge } from "./ScholarshipBadge";
import { FactorBars } from "./FactorBars";

const COUNTRY_NAMES: Record<string, string> = {
  US: "США",
  UK: "Великобритания",
  DE: "Германия",
  KR: "Корея",
  TR: "Турция",
};

type ProgramCardProps = {
  recommendation: Recommendation;
  /** 1-indexed position by fit score — used to give the top pick real visual priority. */
  rank: number;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  /** Compare-selection (up to 3, wired up by /recommendations). Both optional: a bare card works fine without them. */
  onToggleSelect?: (id: string) => void;
  isSelected?: boolean;
  /** True once 3 are already selected and this one isn't one of them — selecting is blocked, not hidden. */
  selectDisabled?: boolean;
  /** Real LLM why-text (POST /api/explain) when available; falls back to the local template. */
  whyTextOverride?: string;
};

/**
 * One recommended program. Never rendered as a numbered sequence (SPEC.md
 * global constraints) — `rank` only controls how much visual weight the top
 * pick gets, not a "01/02/03" badge. Every cost figure carries a SourceBadge
 * so a demo number is never silently indistinguishable from a real one.
 */
export function ProgramCard({
  recommendation,
  rank,
  onToggleFavorite,
  isFavorite = false,
  onToggleSelect,
  isSelected = false,
  selectDisabled = false,
  whyTextOverride,
}: ProgramCardProps) {
  const { program, factors, fitScore, label, stretch } = recommendation;
  const isTop = rank === 1;
  const why = whyTextOverride ?? whyTextFor(recommendation);
  const costSourceValue: string | "demo" = program.dataStatus === "demo" ? "demo" : program.sourceUrl;
  const countryName = COUNTRY_NAMES[program.country] ?? program.country;

  return (
    <article
      className={cn(
        "relative flex flex-col gap-4 rounded-xl border bg-card text-card-foreground",
        isTop ? "border-primary/40 p-6 sm:p-7" : "border-border p-5",
      )}
    >
      {onToggleFavorite ? (
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          onClick={() => onToggleFavorite(program.id)}
          className="absolute top-4 right-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <BookmarkIcon
            className={cn("size-5", isFavorite && "fill-primary text-primary")}
            aria-hidden="true"
          />
        </button>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
        <div className="min-w-0">
          <h3
            className={cn(
              "font-semibold tracking-tight text-balance",
              isTop ? "text-xl sm:text-2xl" : "text-base",
            )}
          >
            <Link href={`/program/${program.id}`} className="hover:underline">
              {program.university}
            </Link>
          </h3>
          <p className={cn("mt-1 text-muted-foreground", isTop ? "text-[0.9375rem]" : "text-sm")}>
            {program.program} · {program.city}, {countryName}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <LabelBadge label={label} />
            <ScholarshipBadge available={program.scholarshipAvailable} />
            {stretch ? (
              <span className="text-[0.6875rem] text-muted-foreground">
                добавлено, чтобы подборка не была пустой
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={cn(
              "font-bold tabular-nums tracking-tight",
              isTop ? "text-4xl" : "text-2xl",
            )}
          >
            {fitScore}
          </span>
          <span className="text-[0.6875rem] text-muted-foreground">из 100 — насколько подходит</span>
        </div>
      </div>

      <p className={cn("text-pretty leading-relaxed", isTop ? "text-[0.9375rem]" : "text-sm text-foreground/90")}>
        {why}
      </p>

      <FactorBars factors={factors} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium tabular-nums">{formatUsd(program.tuitionUsdYear)}</span>
          <span className="text-muted-foreground">обучение +</span>
          <span className="font-medium tabular-nums">{formatUsd(program.livingUsdYear)}</span>
          <span className="text-muted-foreground">жизнь / год</span>
          <SourceBadge sourceUrl={costSourceValue} />
        </div>

        {onToggleSelect ? (
          <label
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium transition-colors",
              isSelected ? "border-primary bg-accent text-accent-foreground" : "text-foreground",
              selectDisabled && !isSelected ? "opacity-50" : "cursor-pointer hover:bg-muted",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={isSelected}
              disabled={selectDisabled && !isSelected}
              onChange={() => onToggleSelect(program.id)}
            />
            {isSelected ? <CheckIcon className="size-4" aria-hidden="true" /> : null}
            {isSelected ? "Выбрано для сравнения" : "Сравнить"}
          </label>
        ) : null}
      </div>
    </article>
  );
}
