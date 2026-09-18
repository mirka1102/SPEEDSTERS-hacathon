import type { Label } from "@shared/types";
import { cn } from "@/lib/utils";

// "Safety" / "Match" / "Reach" are kept in English on purpose: they're the
// exact loanwords Kazakhstani applicants already use when researching US-style
// admissions (safety/match/reach school), even in otherwise-Russian text —
// translating them would make the badge less recognizable, not more.
const LABEL_TEXT: Record<Label, string> = {
  safety: "Safety",
  match: "Match",
  reach: "Reach",
};

const LABEL_CLASS: Record<Label, string> = {
  safety: "bg-label-safety text-label-safety-foreground",
  match: "bg-label-match text-label-match-foreground",
  reach: "bg-label-reach text-label-reach-foreground",
};

type LabelBadgeProps = {
  label: Label;
  className?: string;
};

/** Small fit-category chip: one of the three `bg-label-*` design tokens (SPEC.md §8). */
export function LabelBadge({ label, className }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-semibold",
        LABEL_CLASS[label],
        className,
      )}
    >
      {LABEL_TEXT[label]}
    </span>
  );
}
