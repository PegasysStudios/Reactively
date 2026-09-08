"use client";

import { ChevronDown } from "lucide-react";
import { Select } from "radix-ui";

import { useEditorStore } from "@/lib/state/editor-store";
import { cn } from "@/lib/utils";

export interface InspectorSelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Compact inspector dropdown.
 *
 * Native `<select>` cannot pad or flip its caret, so inspector menus use this control.
 * Open state is tracked in editor UI state so a canvas click that dismisses the menu does
 * not also clear the selected component.
 *
 * The menu is portaled to `document.body`, outside `.editor-theme`. The light editor tokens
 * are reapplied on the content so OS dark mode does not paint a dark menu over the editor.
 */
export function InspectorSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: readonly InspectorSelectOption[];
  onValueChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <Select.Root
      value={value}
      onOpenChange={(open) => useEditorStore.getState().setInspectorDropdownOpen(open)}
      onValueChange={onValueChange}
    >
      <Select.Trigger
        aria-label={label}
        data-value={value}
        className={cn(
          "group flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-md border border-border bg-background py-0 pl-2.5 pr-2.5 text-left text-[11px] text-foreground outline-none transition-colors",
          "focus:border-primary focus:ring-2 focus:ring-primary/10",
          "data-[state=open]:border-primary",
        )}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <Select.Icon className="mr-0.5 shrink-0">
          <ChevronDown
            className="size-3.5 text-foreground-muted transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          side="bottom"
          sideOffset={4}
          className="editor-theme z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-background p-0.5 text-foreground shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
          onPointerDownOutside={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest("main[aria-label*=' canvas ']")
            ) {
              useEditorStore.getState().armCanvasClearSuppression();
            }
          }}
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex h-8 cursor-pointer items-center rounded-sm px-2.5 text-[11px] text-foreground outline-none data-[highlighted]:bg-surface-muted data-[state=checked]:text-primary"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
