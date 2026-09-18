import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  /** 1-indexed position of the step being shown. */
  current: number;
  /** How many numbered stops the journey has. */
  total: number;
  /** Names of the numbered stops, in order. */
  labels: string[];
};

/**
 * The "where am I" marker every step page renders at the top of its content.
 * The segments carry done / here / next; the caption names the step out loud,
 * so nothing is communicated by color alone.
 */
export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  const label = labels[current - 1];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => {
          const position = index + 1;
          return (
            <span
              key={position}
              className={cn(
                "h-1 flex-1 rounded-full",
                position < current && "bg-primary/40",
                position === current && "bg-primary",
                position > current && "bg-border",
              )}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        <span>
          Step {current} of {total}
        </span>
        {label ? (
          <>
            {" — "}
            <span className="font-medium text-foreground">{label}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
