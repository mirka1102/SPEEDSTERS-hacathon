import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The frame every page renders inside: a slim sticky header with the wordmark,
 * and a centered reading column. Step pages render their own StepIndicator —
 * the landing page is the entry, not a numbered stop.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center px-5">
          <Link
            href="/"
            className="rounded-sm text-base font-semibold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Steer
          </Link>
        </div>
      </header>
      <main className="flex-1 px-5 pb-20">
        <div className="mx-auto w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
