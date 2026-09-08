import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Marketing shell.
 *
 * This layout and everything under it must stay free of editor code: no canvas, no
 * project store, no dnd-kit, no preview runtime, no generator. The editor will grow into
 * the largest part of Reactively, and a public landing page that ships it would be slow
 * for every visitor who never opens the product.
 *
 * `apps/web/tests/route-boundaries.test.ts` enforces this.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Reactively
        </Link>
        <nav className="flex items-center gap-6 text-sm text-foreground-muted">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border px-6 py-6 text-xs text-foreground-muted">
        Reactively — React Native, visually.
      </footer>
    </div>
  );
}
