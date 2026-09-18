"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/lib/store";
import { DataScreenSkeleton } from "@/components/shell/DataScreenSkeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * SPEC.md §2 route table: a saved-profile link that opens straight to the
 * roadmap. There's no backend yet (SPEC.md §4: profileId "kept in
 * localStorage"), so this only resolves on the device that created the
 * link — the not-found state says so honestly instead of pretending.
 */
export function SavedProfile({ id }: { id: string }) {
  const router = useRouter();
  const { profileId, hydrated } = useProfileStore();
  const matches = hydrated && profileId === id;

  useEffect(() => {
    if (matches) router.replace("/roadmap");
  }, [matches, router]);

  if (!hydrated || matches) return <DataScreenSkeleton />;

  return (
    <div className="pt-6 pb-16 sm:pt-10">
      <h1 className="text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
        Профиль не найден
      </h1>
      <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
        Эта ссылка открывает план, сохранённый на другом устройстве или в другом браузере. На
        этом — такого профиля пока нет.
      </p>
      <Link href="/profile" className={cn(buttonVariants(), "mt-6 h-11 px-6 text-[0.9375rem]")}>
        Пройти анкету
      </Link>
    </div>
  );
}
