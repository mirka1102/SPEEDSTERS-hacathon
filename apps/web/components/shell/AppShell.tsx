"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ProfileDrawer } from "./ProfileDrawer";

/** Landing and the questionnaire are the only screens without a profile to edit or favorite yet. */
const ROUTES_WITHOUT_NAV = ["/", "/profile"];

type AppShellProps = {
  children: ReactNode;
  /**
   * Overrides the width of the centered content column. Screens that need more
   * room than the reading measure — the Compare table, for one — pass a wider
   * `max-w-*` here. Omit it for the default `max-w-2xl`.
   */
  contentClassName?: string;
};

/**
 * The frame every page renders inside: a slim sticky header with the wordmark,
 * and a centered reading column. Step pages render their own StepIndicator —
 * the landing page is the entry, not a numbered stop.
 */
export function AppShell({ children, contentClassName }: AppShellProps) {
  const pathname = usePathname();
  const showNav = pathname != null && !ROUTES_WITHOUT_NAV.includes(pathname);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-5">
          <Link
            href="/"
            className="rounded-sm text-base font-semibold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Steer
          </Link>
          {showNav ? (
            <div className="flex items-center gap-2">
              <Link
                href="/favorites"
                aria-label="Избранное"
                className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <BookmarkIcon className="size-4" aria-hidden="true" />
              </Link>
              <ProfileDrawer />
            </div>
          ) : null}
        </div>
      </header>
      <main className="flex-1 px-5 pb-20">
        <div className={cn("mx-auto w-full max-w-2xl", contentClassName)}>
          {children}
        </div>
      </main>
    </div>
  );
}
