import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A titled region of editor chrome.
 *
 * Extracted so the left sidebar sections, the inspector and future panels share one
 * header rhythm instead of each inventing its own spacing.
 */
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-[0_1px_2px_rgba(16,24,40,0.02)]",
        className,
      )}
    >
      <header className="flex h-11 shrink-0 items-center justify-between px-4">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {action}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
