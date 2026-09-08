"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible } from "radix-ui";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Compact disclosure section shared by current and future inspector controls. */
export function InspectorSection({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Collapsible.Root open={isExpanded} onOpenChange={setIsExpanded} asChild>
      <section className="border-b border-border last:border-b-0">
        <Collapsible.Trigger className="flex h-10 w-full items-center justify-between px-4 text-left hover:bg-surface-muted/70">
          <span role="heading" aria-level={3} className="text-[11px] font-semibold text-foreground">
            {title}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-foreground-muted transition-transform",
              !isExpanded && "-rotate-90",
            )}
            aria-hidden
          />
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="space-y-3 px-4 pb-4">{children}</div>
        </Collapsible.Content>
      </section>
    </Collapsible.Root>
  );
}
