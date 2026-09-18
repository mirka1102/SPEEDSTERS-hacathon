"use client";

import Link from "next/link";
import { DataScreenSkeleton } from "@/components/shell/DataScreenSkeleton";
import { useProfileStore } from "@/lib/store";
import { getPrograms } from "@/lib/api";
import { scoreProgramForAnswers } from "@/lib/mockEngine";
import { ProgramCard } from "@/components/program/ProgramCard";

/**
 * SPEC.md §10: bookmarked programs, deliberately independent of the
 * Compare/Roadmap selection — browsing and bookmarking shouldn't force the
 * user into either. Every favorite gets its own up-to-date fit score against
 * the current answers (`scoreProgramForAnswers`), not just whichever made
 * the algorithmic top picks on Recommendations.
 */
export function Favorites() {
  const { answers, favorites, toggleFavorite, hydrated } = useProfileStore();

  if (!hydrated) return <DataScreenSkeleton />;

  const allPrograms = new Map(getPrograms().map((p) => [p.id, p]));
  const favoriteRecommendations = favorites
    .map((id) => allPrograms.get(id))
    .filter((p) => p !== undefined)
    .map((program) => scoreProgramForAnswers(answers, program));

  return (
    <div className="pt-6 pb-16 sm:pt-10">
      <h1 className="text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
        Избранное
      </h1>
      <p className="mt-2.5 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
        Программы, которые ты отметил закладкой — отдельно от тех, что выбраны для сравнения.
      </p>

      {favoriteRecommendations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border p-6 text-center">
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
            Пока ничего не сохранено — отмечай программы значком закладки на карточке.
          </p>
          <Link
            href="/recommendations"
            className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            К рекомендациям
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {favoriteRecommendations.map((recommendation) => (
            <ProgramCard
              key={recommendation.program.id}
              recommendation={recommendation}
              rank={2}
              onToggleFavorite={toggleFavorite}
              isFavorite
            />
          ))}
        </div>
      )}
    </div>
  );
}
