import type { FactorScores } from "@shared/types";
import { cn } from "@/lib/utils";

const FACTOR_ORDER: (keyof FactorScores)[] = [
  "field",
  "budget",
  "academic",
  "exams",
  "country",
  "language",
];

const FACTOR_LABEL: Record<keyof FactorScores, string> = {
  field: "Направление",
  budget: "Бюджет",
  academic: "Оценки",
  exams: "Экзамены",
  country: "Страна",
  language: "Язык",
};

type FactorBarsProps = {
  factors: FactorScores;
  className?: string;
};

/**
 * Six small horizontal bars, one per factor the mock engine scores on
 * (SPEC.md §5) — each labeled, each showing its 0..1 value as a % width.
 * This is what backs up the "why it fits" sentence with something you can
 * actually see, instead of asking the reader to trust a single number.
 */
export function FactorBars({ factors, className }: FactorBarsProps) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-2.5", className)}>
      {FACTOR_ORDER.map((key) => {
        const pct = Math.round(factors[key] * 100);
        return (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-[0.6875rem] text-muted-foreground">
              <dt>{FACTOR_LABEL[key]}</dt>
              <dd className="tabular-nums">{pct}%</dd>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
