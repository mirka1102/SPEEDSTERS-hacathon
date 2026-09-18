"use client";

import Link from "next/link";
import type { Answers, FactorScores, Recommendation } from "@shared/types";
import { StepIndicator } from "@/components/shell/StepIndicator";
import { DataScreenSkeleton } from "@/components/shell/DataScreenSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { LabelBadge } from "@/components/program/LabelBadge";
import { SourceBadge } from "@/components/program/SourceBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/store";
import { JOURNEY_LABELS } from "@/lib/journey";
import { getPlan } from "@/lib/api";
import { getWeights } from "@/lib/mockEngine";
import { buildFactorRows, fitScoreCells } from "@/lib/compareRows";
import { formatDate } from "@/lib/labels";

function costSource(program: { dataStatus: "verified" | "demo"; sourceUrl: string }): string | "demo" {
  return program.dataStatus === "demo" ? "demo" : program.sourceUrl;
}

/**
 * Step 5 of SPEC.md §2: 2-3 selected programs side by side, rows ordered by
 * what this user's own weights emphasize (SPEC.md §5), best-in-row cell
 * highlighted where "better" is objective (cost, GPA bar) — qualitative rows
 * (country, language) are shown without a highlight since neither is
 * strictly "better."
 */
export function Compare() {
  const { answers, selectedPrograms, hydrated } = useProfileStore();

  if (!hydrated) return <DataScreenSkeleton />;

  const { recommendations } = getPlan(answers, selectedPrograms);
  const selected = recommendations.filter((r) => selectedPrograms.includes(r.program.id));

  return (
    <div className="pt-6 pb-16 sm:pt-10">
      <StepIndicator current={5} total={JOURNEY_LABELS.length} labels={JOURNEY_LABELS} />

      <h1 className="mt-9 text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
        Сравнение
      </h1>

      {selected.length < 2 ? (
        <div className="mt-8 rounded-xl border border-border p-6 text-center">
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
            Выбери 2–3 программы на странице рекомендаций, чтобы сравнить их здесь.
          </p>
          <Link
            href="/recommendations"
            className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            К рекомендациям
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2.5 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
            Строки идут в порядке того, что для тебя важнее всего — так, как ты ответил в анкете.
          </p>

          <CompareTable selected={selected} answers={answers} />

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/recommendations"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-[0.9375rem]")}
            >
              Назад к рекомендациям
            </Link>
            <Link
              href="/roadmap"
              className={cn(buttonVariants(), "h-11 px-6 text-[0.9375rem] tracking-tight sm:ml-auto")}
            >
              Собрать план
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function CompareTable({ selected, answers }: { selected: Recommendation[]; answers: Answers }) {
  const weights = getWeights(answers);
  const weightOrder = (Object.keys(weights) as (keyof FactorScores)[]).sort(
    (a, b) => weights[b] - weights[a],
  );
  const fitRow = fitScoreCells(selected);
  const factorRows = buildFactorRows(selected, weightOrder);

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-32" />
            {selected.map((r) => (
              <TableHead key={r.program.id} className="min-w-40">
                <p className="text-[0.9375rem] font-semibold tracking-tight whitespace-normal">
                  {r.program.university}
                </p>
                <p className="mt-0.5 text-xs font-normal whitespace-normal text-muted-foreground">
                  {r.program.city}
                </p>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead>Соответствие</TableHead>
            {fitRow.cells.map((cell, i) => (
              <TableCell key={selected[i].program.id} className={cn(fitRow.highlightIndex === i && "font-semibold text-primary")}>
                {cell}
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableHead>Категория</TableHead>
            {selected.map((r) => (
              <TableCell key={r.program.id}>
                <LabelBadge label={r.label} />
              </TableCell>
            ))}
          </TableRow>

          {factorRows.map((row) => (
            <TableRow key={row.key}>
              <TableHead>{row.label}</TableHead>
              {row.cells.map((cell, i) => (
                <TableCell
                  key={selected[i].program.id}
                  className={cn("whitespace-normal", row.highlightIndex === i && "font-semibold text-primary")}
                >
                  {cell}
                  {row.key === "budget" ? (
                    <SourceBadge sourceUrl={costSource(selected[i].program)} className="ml-2 align-middle" />
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}

          <TableRow>
            <TableHead>Дедлайн подачи</TableHead>
            {selected.map((r) => (
              <TableCell key={r.program.id} className="whitespace-normal">
                {formatDate(r.program.applicationDeadline)}
                <SourceBadge sourceUrl={costSource(r.program)} className="ml-2 align-middle" />
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableHead>Стипендия</TableHead>
            {selected.map((r) => (
              <TableCell key={r.program.id} className="whitespace-normal">
                {r.program.scholarshipAvailable ? r.program.scholarshipNote ?? "Есть" : "Нет"}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
