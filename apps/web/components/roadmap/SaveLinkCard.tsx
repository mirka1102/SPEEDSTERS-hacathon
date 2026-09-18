"use client";

import { useState } from "react";
import { LinkIcon } from "lucide-react";

/**
 * SPEC.md §2 route table's `/p/[id]`: the "returning user" link only works if
 * the student actually saves it somewhere first. This is that moment.
 */
export function SaveLinkCard({ profileId }: { profileId: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/p/${profileId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable — nothing to recover into, the button just
      // stays clickable for another try.
    }
  };

  return (
    <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
      <p className="text-[0.8125rem] leading-relaxed text-muted-foreground text-pretty">
        Сохрани ссылку — она откроет этот план на этом устройстве в любой момент.
      </p>
      <button
        type="button"
        onClick={copyLink}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors hover:bg-muted"
      >
        <LinkIcon className="size-3.5" aria-hidden="true" />
        {copied ? "Скопировано" : "Скопировать ссылку"}
      </button>
    </div>
  );
}
