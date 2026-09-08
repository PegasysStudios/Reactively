"use client";

import { EditorDeviceFrame } from "./editor-device-frame";

/** The editor-hosted preview layout. Runtime content remains isolated in its iframe. */
export function EditorPreview({ projectId }: { projectId: string }) {
  return (
    <main
      aria-label="Preview layout"
      className="m-2 flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-[radial-gradient(circle_at_center,#fafaff_0%,var(--reactively-editor-canvas)_74%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
    >
      <EditorDeviceFrame>
        <iframe
          title="Application preview"
          src={`/preview/${projectId}`}
          className="h-full w-full border-0 bg-white"
        />
      </EditorDeviceFrame>
    </main>
  );
}
