import type { Metadata, Viewport } from "next";

import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

/**
 * Root layout.
 *
 * Deliberately thin. It owns `<html>`/`<body>`, the design tokens and the small set of
 * providers every route needs (server-state caching, tooltips). Everything route-specific
 * — marketing chrome, dashboard navigation, the editor shell — belongs to that route's own
 * layout, so the marketing page never pays for editor code and the preview route stays
 * isolated from both.
 */
export const metadata: Metadata = {
  title: {
    default: "Reactively",
    template: "%s · Reactively",
  },
  description: "React Native, visually. Build real React Native applications in your browser.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
