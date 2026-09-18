import { cn } from "@/lib/utils";

type ScholarshipBadgeProps = {
  available: boolean;
  className?: string;
};

/**
 * SPEC.md §10: `scholarshipAvailable` already exists on every `Program` and
 * already feeds a roadmap finance task — this just makes it visible instead
 * of buried, on `ProgramCard` and `ProgramDetail`.
 */
export function ScholarshipBadge({ available, className }: ScholarshipBadgeProps) {
  if (!available) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full bg-label-safety/15 px-2 text-[0.6875rem] font-semibold text-label-safety",
        className,
      )}
    >
      Стипендия
    </span>
  );
}
