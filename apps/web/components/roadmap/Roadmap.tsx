"use client";

import { useState } from "react";
import Link from "next/link";
import { StepIndicator } from "@/components/shell/StepIndicator";
import { DataScreenSkeleton } from "@/components/shell/DataScreenSkeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/lib/store";
import { JOURNEY_LABELS } from "@/lib/journey";
import { getPlan } from "@/lib/api";
import { effectiveProgress } from "@/lib/roadmapProgress";
import { NextActionCard } from "./NextActionCard";
import { Timeline } from "./Timeline";
import { CalendarView } from "./CalendarView";
import { SaveLinkCard } from "./SaveLinkCard";

type ViewMode = "timeline" | "calendar";

/**
 * Steps 6 + 7 of SPEC.md §2 on one route: the dated plan (Timeline), with
 * the single next action pinned at the top — this is where a returning
 * user lands via a saved profile link (route table, `/p/[id]`).
 */
export function Roadmap() {
  const { answers, selectedPrograms, progress, toggleTaskDone, hydrated, profileId } = useProfileStore();
  const [view, setView] = useState<ViewMode>("timeline");

  if (!hydrated) return <DataScreenSkeleton />;

  const { roadmap } = getPlan(answers, selectedPrograms);
  const { progressPct, nextActionTaskId, doneCount } = effectiveProgress(roadmap.tasks, progress);
  const nextTask = roadmap.tasks.find((t) => t.id === nextActionTaskId) ?? null;

  return (
    <div className="pt-6 pb-16 sm:pt-10">
      <StepIndicator current={6} total={JOURNEY_LABELS.length} labels={JOURNEY_LABELS} />

      <h1 className="mt-9 text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
        План
      </h1>

      {roadmap.tasks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border p-6 text-center">
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
            Пока не с чем построить план — вернись к рекомендациям и выбери программы.
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
          <div className="mt-6">
            <NextActionCard
              task={nextTask}
              progressPct={progressPct}
              doneCount={doneCount}
              totalCount={roadmap.tasks.length}
              onToggleDone={toggleTaskDone}
            />
          </div>

          <SaveLinkCard profileId={profileId} />

          <div className="mt-8 flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={view === "timeline" ? "default" : "outline"}
              onClick={() => setView("timeline")}
            >
              Таймлайн
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "calendar" ? "default" : "outline"}
              onClick={() => setView("calendar")}
            >
              Календарь
            </Button>
          </div>

          <div className="mt-4">
            {view === "timeline" ? (
              <Timeline roadmap={roadmap} progress={progress} onToggleDone={toggleTaskDone} />
            ) : (
              <CalendarView roadmap={roadmap} progress={progress} onToggleDone={toggleTaskDone} />
            )}
          </div>
        </>
      )}

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/compare"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5 text-[0.9375rem]")}
        >
          Назад к сравнению
        </Link>
      </div>
    </div>
  );
}
