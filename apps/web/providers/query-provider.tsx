"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * TanStack Query owns *server* state: users, projects, permissions, assets, builds and
 * revisions.
 *
 * It is explicitly not the editor's document store. The project being edited is local,
 * synchronous and mutated hundreds of times a minute through commands; modelling it as
 * cache state would make undo, dirty tracking and offline editing fight the cache.
 * Zustand owns that. See lib/state/.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Editor sessions are long-lived; refetching on every window focus would be noise.
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Created in state so each browser session gets one client, and so a client is never
  // shared across requests during server rendering.
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
