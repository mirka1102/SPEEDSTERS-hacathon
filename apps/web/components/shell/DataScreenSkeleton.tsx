import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while `useProfileStore` hydrates from localStorage (SPEC.md §8 loading
 * state). Every screen that computes a plan from `answers` renders this
 * instead of a real skeleton-of-nothing flash of the wrong person's data.
 */
export function DataScreenSkeleton() {
  return (
    <div className="pt-6 pb-16 sm:pt-10" aria-busy="true" aria-label="Загрузка">
      <Skeleton className="h-1 w-full rounded-full" />
      <Skeleton className="mt-9 h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full max-w-[54ch]" />
      <Skeleton className="mt-2 h-4 w-4/5 max-w-[54ch]" />
      <div className="mt-8 flex flex-col gap-5">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
