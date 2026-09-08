"use client";

import { Tooltip } from "radix-ui";
import type { ReactNode } from "react";

import { QueryProvider } from "./query-provider";

/**
 * Providers every route needs.
 *
 * Kept intentionally small: anything editor-specific (project store hydration, keyboard
 * shortcut scopes, canvas context) belongs in the editor layout so it never reaches the
 * marketing or preview bundles.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>
    </QueryProvider>
  );
}
