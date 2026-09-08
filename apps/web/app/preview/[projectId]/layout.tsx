import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Preview",
  // The preview is an application surface, not content. Never index it.
  robots: { index: false, follow: false },
};

/**
 * Preview shell.
 *
 * Intentionally bare. This route is designed to be loaded inside an iframe by the editor,
 * so it must not render Reactively's own navigation, and it must not depend on any editor
 * React state — the two communicate over `postMessage` using the protocol in
 * @reactively/preview-runtime, never through shared context.
 */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
