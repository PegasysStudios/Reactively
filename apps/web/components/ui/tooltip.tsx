"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tooltip wrapper.
 *
 * The provider lives once in `providers/app-providers.tsx`, so callers only supply a
 * trigger and content. The editor toolbar will be dense with icon-only controls, and every
 * one of them needs a label for accessibility.
 */
export function Tooltip({
  children,
  content,
  side = "bottom",
  className,
}: {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground shadow-md",
            className,
          )}
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
