"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * One answerable option. `label` is what the student reads, `hint` the line of
 * plain-language context under it. Where the same wording repeats across
 * questions (all three exam blocks say "Есть балл"), the enclosing question's
 * legend is what tells them apart — see `Question`.
 */
export type Option<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

/**
 * A single question: a fieldset so the whole thing is one named group, its
 * legend read out as the question itself.
 */
export function Question({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="text-[1.0625rem] leading-snug font-semibold tracking-tight text-pretty">
        {title}
      </legend>
      {hint ? (
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground text-pretty">
          {hint}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

/**
 * Hairline-bordered tap target, sized for a thumb at 375px. The border is the
 * only separator — no shadows — and it turns brand-colored once picked, so the
 * selection reads without relying on the small dot alone.
 */
const rowClass =
  "flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3.5 transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/[0.04]";

function OptionBody({ label, hint }: Omit<Option<string>, "value">) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-[0.9375rem] leading-snug font-medium tracking-tight">
        {label}
      </span>
      {hint ? (
        <span className="mt-1 block text-[0.8125rem] leading-snug text-muted-foreground text-pretty">
          {hint}
        </span>
      ) : null}
    </span>
  );
}

/** Pick exactly one. */
export function SingleChoice<T extends string>({
  groupLabel,
  value,
  options,
  onChange,
}: {
  groupLabel: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <RadioGroup
      aria-label={groupLabel}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className="gap-2"
    >
      {options.map((option) => (
        <label key={option.value} className={rowClass}>
          <RadioGroupItem value={option.value} className="mt-[3px]" />
          <OptionBody label={option.label} hint={option.hint} />
        </label>
      ))}
    </RadioGroup>
  );
}

/** Pick any number (the caller decides what a click means — see the max-two fields). */
export function MultiChoice<T extends string>({
  values,
  options,
  onToggle,
}: {
  values: readonly T[];
  options: Option<T>[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <label key={option.value} className={rowClass}>
          <Checkbox
            className="mt-[3px]"
            aria-label={option.label}
            checked={values.includes(option.value)}
            onCheckedChange={() => onToggle(option.value)}
          />
          <OptionBody label={option.label} hint={option.hint} />
        </label>
      ))}
    </div>
  );
}

/**
 * Compact one-of-many for short scales (language levels), where full rows would
 * turn three languages into eighteen stacked boxes on a phone.
 */
export function ChipChoice<T extends string>({
  groupLabel,
  value,
  options,
  onChange,
}: {
  groupLabel: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <RadioGroup
      aria-label={groupLabel}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className="grid grid-cols-3 gap-1.5"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[0.8125rem] font-medium transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/[0.06]"
        >
          <RadioGroupItem value={option.value} className="size-3.5" />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  );
}
