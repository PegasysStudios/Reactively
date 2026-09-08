import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Dashboard shell.
 *
 * Where logged-in project management will live: project list, creation, settings, builds.
 * Separate from both the marketing site (different chrome, different audience) and the
 * editor (different layout entirely).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Reactively
        </Link>
        <span className="text-xs text-foreground-muted">Local projects</span>
      </header>

      <main className="flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
