"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/shell/StepIndicator";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/lib/store";
import { GROUPS } from "./groups";

/** The seven stops of SPEC.md §2; the questionnaire is stop two. */
const JOURNEY_LABELS = [
  "Старт",
  "Анкета",
  "Диагностика",
  "Рекомендации",
  "Сравнение",
  "План",
  "Следующий шаг",
];

/**
 * The questionnaire of SPEC.md §3: one group of questions per screen, every
 * field pre-filled from DEFAULT_ANSWERS, every answer saved to localStorage the
 * moment it changes. Nothing is required, so the forward button is never
 * disabled — "I haven't decided yet" is a real answer here.
 */
export function Questionnaire() {
  const router = useRouter();
  const { answers, setAnswers } = useProfileStore();
  const [index, setIndex] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const group = GROUPS[index];
  const isLast = index === GROUPS.length - 1;
  const Body = group.Body;

  const scrollToTop = () => {
    const node = topRef.current;
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ block: "start" });
    }
  };

  const goTo = (next: number) => {
    setIndex(next);
    scrollToTop();
  };

  return (
    <div ref={topRef} className="scroll-mt-20 pt-6 pb-12 sm:pt-10">
      <StepIndicator current={2} total={JOURNEY_LABELS.length} labels={JOURNEY_LABELS} />

      <p className="mt-9 text-[0.8125rem] text-muted-foreground tabular-nums">
        Блок {index + 1} из {GROUPS.length}
      </p>
      <h1 className="mt-1 text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[2rem]">
        {group.title}
      </h1>
      <p className="mt-2.5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted-foreground text-pretty">
        {group.lead}
      </p>

      {/* gap, not space-y: the groups' <fieldset>s carry `m-0`, which outranks
          Tailwind's zero-specificity space-y rule and would collapse the gaps. */}
      <div className="mt-9 flex flex-col gap-10">
        <Body answers={answers} set={setAnswers} />
      </div>

      <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {index > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 px-5 text-[0.9375rem]"
            onClick={() => goTo(index - 1)}
          >
            Назад
          </Button>
        ) : null}

        <Button
          type="button"
          className="h-11 px-6 text-[0.9375rem] tracking-tight sm:ml-auto"
          onClick={() => (isLast ? router.push("/diagnosis") : goTo(index + 1))}
        >
          {isLast ? "Смотреть диагностику" : "Дальше"}
        </Button>
      </div>

      <p className="mt-4 text-[0.8125rem] leading-relaxed text-muted-foreground text-pretty">
        Ответы сохраняются сами. Можно закрыть вкладку, вернуться завтра и продолжить
        с этого же места — и поменять любой ответ после того, как увидишь результат.
      </p>
    </div>
  );
}
