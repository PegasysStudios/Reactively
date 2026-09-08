"use client";

import { ScrollArea as RadixScrollArea } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll container with a consistent scrollbar across platforms.
 *
 * The editor's layers tree and component library are long lists inside fixed panels;
 * native scrollbars differ enough between macOS and Windows to shift panel layout.
 */
export function ScrollArea({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <RadixScrollArea.Root className={cn("overflow-hidden", className)}>
      <RadixScrollArea.Viewport className="h-full w-full">{children}</RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none p-0.5"
      >
        <RadixScrollArea.Thumb className="flex-1 rounded-full bg-border" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
}
