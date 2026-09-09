"use client";

import { isNodeInScreenTree } from "@reactively/editor-engine";
import type { ReactivelyProject, ScreenId } from "@reactively/project-schema";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useEffect } from "react";

import { DEFAULT_PREVIEW_VIEWPORT } from "@reactively/preview-runtime";

import { useEditorStore } from "@/lib/state/editor-store";

import { EditorComponentRenderer } from "./editor-component-renderer";
import { EditorDeviceFrame } from "./editor-device-frame";

/**
 * Centre canvas region.
 *
 * A device-frame placeholder. Two things are settled here even though nothing is
 * implemented yet:
 *
 * 1. The device frame is presentation only. The application's coordinate space is the
 *    viewport inside it, and frame chrome is never part of it.
 * 2. The canvas will render from computed layout produced by @reactively/layout-engine,
 *    independently of the preview iframe. Rendering both from the same document, through
 *    different paths, is what surfaces editor/runtime parity bugs instead of hiding them.
 */
export function EditorCanvas({
  project,
  screenId,
  screenName,
}: {
  project: ReactivelyProject;
  screenId: ScreenId;
  screenName: string;
}) {
  const { width, height, label } = DEFAULT_PREVIEW_VIEWPORT;
  const screen = project.screens[screenId];
  const rootNode = screen ? project.nodes[screen.rootNodeId] : undefined;
  const rootChildren = rootNode?.children ?? [];
  const selectedNodeId = useEditorStore((state) => state.selection.primaryNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);
  const clearSelection = useEditorStore((state) => state.clearSelection);

  useEffect(() => {
    if (selectedNodeId && !isNodeInScreenTree(project, screenId, selectedNodeId)) {
      clearSelection();
    }
  }, [clearSelection, project, screenId, selectedNodeId]);

  return (
    <main
      aria-label={`${screenName} canvas for project ${project.id}`}
      className="relative m-2 min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-[radial-gradient(circle_at_center,#fafaff_0%,var(--reactively-editor-canvas)_74%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
      onPointerDown={() => {
        if (useEditorStore.getState().inspectorDropdownOpenCount > 0) {
          useEditorStore.getState().armCanvasClearSuppression();
        }
      }}
      onClick={() => {
        const editor = useEditorStore.getState();
        if (editor.inspectorDropdownOpenCount > 0 || editor.consumeCanvasClearSuppression()) {
          return;
        }

        clearSelection();
      }}
    >
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
        <div className="flex h-9 items-center rounded-lg border border-border bg-background p-1 shadow-[0_2px_8px_rgba(16,24,40,0.06)]">
          <CanvasControl label="Undo">
            <Undo2 className="size-3.5" aria-hidden />
          </CanvasControl>
          <CanvasControl label="Redo">
            <Redo2 className="size-3.5" aria-hidden />
          </CanvasControl>
        </div>

        {/* <CanvasControlGroup>
          <CanvasControl label="Export">
            <Download className="size-3.5" aria-hidden />
          </CanvasControl>
        </CanvasControlGroup> */}

        <div className="flex h-9 items-center rounded-lg border border-border bg-background p-1 shadow-[0_2px_8px_rgba(16,24,40,0.06)]">
          <CanvasControl label="Zoom out">
            <Minus className="size-3.5" aria-hidden />
          </CanvasControl>
          <span className="min-w-14 border-x border-border px-2 text-center text-xs font-medium">
            75%
          </span>
          <CanvasControl label="Zoom in">
            <Plus className="size-3.5" aria-hidden />
          </CanvasControl>
        </div>
      </div>

      <div className="flex h-full items-center justify-center p-6">
        <EditorDeviceFrame>
          <div className="h-full overflow-y-auto px-6 py-7">
            <p className="mb-5 text-sm font-semibold text-[#11162a]">{screenName} Screen</p>

            {rootChildren.length > 0 ? (
              <div className="relative flex flex-col items-stretch gap-3">
                {rootChildren.flatMap((nodeId) => {
                  const node = project.nodes[nodeId];
                  return node
                    ? [
                        <EditorComponentRenderer
                          key={node.id}
                          node={node}
                          nodes={project.nodes}
                          isSelected={selectedNodeId === node.id}
                          selectedNodeId={selectedNodeId}
                          onSelect={selectNode}
                        />,
                      ]
                    : [];
                })}
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center text-center">
                <p className="text-xs text-[#8791a5]">Add a component to get started.</p>
              </div>
            )}
          </div>
        </EditorDeviceFrame>
      </div>

      <span className="sr-only">
        {label}, {width} by {height} pixels
      </span>
    </main>
  );
}

function CanvasControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-md text-foreground-muted"
    >
      {children}
    </button>
  );
}
