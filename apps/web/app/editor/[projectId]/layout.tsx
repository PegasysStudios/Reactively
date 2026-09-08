import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Editor",
};

/**
 * Editor shell layout.
 *
 * The editor is a full-viewport application workspace, not a page inside the marketing
 * site — it inherits none of that chrome. `overflow-hidden` on a fixed-height container is
 * load-bearing: panels scroll independently and the canvas must never scroll the document.
 */
export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="editor-theme flex h-dvh flex-col overflow-hidden bg-editor-workspace text-foreground">
      {children}
    </div>
  );
}
