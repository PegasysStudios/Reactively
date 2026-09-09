"use client";

import { getValidParentCandidates } from "@reactively/editor-engine";
import type { ComponentNode, ReactivelyProject, ScreenId } from "@reactively/project-schema";

import { createEditorCommandContext } from "@/lib/editor/command-context";
import { projectCommands } from "@/lib/state/project-commands";

import { InspectorSelect } from "./inspector-select";

const commandContext = createEditorCommandContext();

/** Resolves the visual parent name without copying hierarchy into inspector state. */
export function getParentDisplayName(project: ReactivelyProject, node: ComponentNode): string {
  const screen = Object.values(project.screens).find(
    (candidate) => candidate.rootNodeId === node.id || candidate.rootNodeId === node.parentId,
  );

  if (screen) {
    return `${screen.name} (Screen)`;
  }

  if (!node.parentId) {
    return "No parent";
  }

  return project.nodes[node.parentId]?.name ?? "Missing parent";
}

export function ParentComponentField({
  project,
  node,
  screenId,
}: {
  project: ReactivelyProject;
  node: ComponentNode;
  screenId: ScreenId | null;
}) {
  const parentName = getParentDisplayName(project, node);
  const candidates = screenId
    ? getValidParentCandidates(project, commandContext, { screenId, nodeId: node.id })
    : [];

  if (!node.parentId || candidates.length === 0) {
    return (
      <div className="border-b border-border px-4 py-3">
        <p className="mb-1.5 text-[10px] font-medium text-foreground-muted">Parent Component</p>
        <div
          role="textbox"
          aria-label="Parent Component"
          aria-readonly="true"
          className="flex h-8 items-center rounded-md border border-border bg-surface-muted/60 px-2.5 text-[11px] text-foreground"
        >
          <span className="truncate">{parentName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border px-4 py-3">
      <p className="mb-1.5 text-[10px] font-medium text-foreground-muted">Parent Component</p>
      <InspectorSelect
        label="Parent Component"
        value={node.parentId}
        options={candidates.map((candidate) => ({
          value: candidate.parentId,
          label: candidate.label,
        }))}
        onValueChange={(newParentId) => {
          if (!screenId || newParentId === node.parentId) {
            return;
          }
          void projectCommands.reparentComponent({
            screenId,
            nodeId: node.id,
            newParentId,
          });
        }}
      />
    </div>
  );
}
