import { cn } from "@/lib/utils";

type SourceBadgeProps = {
  /** A real URL to link to, or the literal string "demo" for demo/estimated data. */
  sourceUrl: string | "demo";
  className?: string;
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Honesty badge for any cost/tuition figure (SPEC.md honesty rules): either a
 * real link to where the number came from, or an explicit "demo data" badge —
 * never silence about which one it is. The demo variant deliberately reuses
 * the neutral border/muted tokens, not a warning color: demo data isn't an
 * error state, just a disclosed limitation.
 */
export function SourceBadge({ sourceUrl, className }: SourceBadgeProps) {
  if (sourceUrl === "demo") {
    return (
      <span
        className={cn(
          "inline-flex h-5 shrink-0 items-center rounded-full border border-border px-2 text-[0.6875rem] font-medium text-muted-foreground",
          className,
        )}
      >
        Demo data
      </span>
    );
  }

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-border px-2 text-[0.6875rem] font-medium text-foreground underline-offset-2 hover:underline",
        className,
      )}
    >
      Источник
      <span className="text-muted-foreground">· {hostnameOf(sourceUrl)}</span>
    </a>
  );
}
