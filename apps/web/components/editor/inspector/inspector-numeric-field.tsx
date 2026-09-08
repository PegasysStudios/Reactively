"use client";

import { useEffect, useState } from "react";

import { finalizeNumericInput, parseNumericInput } from "@/lib/editor/parse-numeric-input";
import { cn } from "@/lib/utils";

const CONTROL_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-border bg-background px-2.5 text-[11px] text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/10";

/**
 * Shared inspector numeric input.
 *
 * Parsing stays in `parse-numeric-input`. This control only owns draft text, commit,
 * and the compact vs labeled chrome used by layout and Flexbox fields.
 */
export function InspectorNumericField({
  label,
  value,
  allowNegative,
  placeholder,
  hideLabel = false,
  compact = false,
  shortLabel,
  onCommit,
  onClear,
}: {
  label: string;
  value: number | undefined;
  allowNegative: boolean;
  placeholder?: string;
  hideLabel?: boolean;
  compact?: boolean;
  shortLabel?: string;
  onCommit: (value: number) => void;
  onClear: () => void;
}) {
  const serialized = value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(serialized);

  useEffect(() => {
    setDraft(serialized);
  }, [serialized]);

  function commitIfValid(raw: string, finalize: boolean) {
    const parsed = finalize ? finalizeNumericInput(raw) : parseNumericInput(raw);
    if (!parsed.ok) {
      return parsed;
    }

    if (!allowNegative && parsed.value < 0) {
      return { ok: false, reason: "invalid" } as const;
    }

    if (parsed.value !== value) {
      onCommit(parsed.value);
    }

    return parsed;
  }

  function handleBlur() {
    const parsed = commitIfValid(draft, true);
    if (parsed.ok) {
      return;
    }

    if (parsed.reason === "empty") {
      if (value !== undefined) {
        onClear();
      }
      setDraft(value === undefined ? "" : serialized);
      return;
    }

    setDraft(serialized);
  }

  const input = (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      placeholder={placeholder}
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        commitIfValid(nextDraft, false);
      }}
      onBlur={handleBlur}
      className={cn(
        compact
          ? "h-full min-w-0 flex-1 bg-transparent pl-1 text-[11px] text-foreground outline-none placeholder:text-foreground-muted"
          : CONTROL_CLASS,
        hideLabel && "w-[3.25rem] shrink-0",
      )}
    />
  );

  if (hideLabel) {
    return (
      <>
        <span className="sr-only">{label}</span>
        {input}
      </>
    );
  }

  if (compact) {
    return (
      <label className="flex h-8 min-w-0 items-center rounded-md border border-border bg-background pl-2 pr-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
        <span aria-hidden className="mr-1 shrink-0 text-[10px] font-medium text-foreground-muted">
          {shortLabel}
        </span>
        {input}
      </label>
    );
  }

  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-medium text-foreground-muted">{label}</span>
      {input}
    </label>
  );
}
