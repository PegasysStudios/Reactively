"use client";

import { getComponentDefinition } from "@reactively/component-registry";
import type { ComponentNode, ReactivelyProject } from "@reactively/project-schema";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/lib/state/editor-store";
import { selectProjectNode, useProjectStore } from "@/lib/state/project-store";

import { ComponentProperties } from "./component-properties";
import { FlexboxSection } from "./flexbox-section";
import { InspectorTabs } from "./inspector-tabs";
import { ParentComponentField } from "./parent-component-field";
import { PositionLayoutSection } from "./position-layout-section";

/** Right-side property inspector rendered directly from canonical project state. */
export function EditorInspector() {
  const selectedNodeId = useEditorStore((state) => state.selection.primaryNodeId);
  const screenId = useEditorStore((state) => state.selection.screenId);
  const project = useProjectStore((state) => state.project);
  const selectedNode = useProjectStore((state) => selectProjectNode(state, selectedNodeId));
  const definition = selectedNode ? getComponentDefinition(selectedNode.type) : undefined;

  return (
    <aside className="w-[345px] shrink-0 bg-editor-workspace py-2 pr-2">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-[0_1px_2px_rgba(16,24,40,0.02)]">
        <header className="flex h-11 shrink-0 items-center border-b border-border px-4">
          <h2 className="text-xs font-semibold tracking-[-0.01em] text-foreground">
            {selectedNode ? (definition?.label ?? selectedNode.type) : "Inspector"}
          </h2>
        </header>

        {selectedNode && project ? (
          <SelectedNodeInspector
            node={selectedNode}
            project={project}
            definition={definition}
            screenId={screenId}
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4">
            <p className="text-xs text-foreground-muted">No component selected</p>
          </div>
        )}
      </section>
    </aside>
  );
}

function SelectedNodeInspector({
  node,
  project,
  definition,
  screenId,
}: {
  node: ComponentNode;
  project: ReactivelyProject;
  definition: ReturnType<typeof getComponentDefinition>;
  screenId: string | null;
}) {
  return (
    <InspectorTabs
      properties={
        <ScrollArea className="h-full">
          <ParentComponentField project={project} node={node} screenId={screenId} />
          <PositionLayoutSection node={node} />
          <FlexboxSection node={node} definition={definition} />
          <ComponentProperties node={node} definition={definition} />
        </ScrollArea>
      }
      style={
        <ScrollArea className="h-full">
          <div className="p-4">
            <p className="text-[11px] leading-5 text-foreground-muted">
              Style editing will be added in a future milestone.
            </p>
          </div>
        </ScrollArea>
      }
    />
  );
}
