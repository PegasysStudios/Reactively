"use client";

import { getAncestorIds, isNodeInScreenTree } from "@reactively/editor-engine";
import type { NodeId, ReactivelyProject, ScreenId } from "@reactively/project-schema";
import { useEffect, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/lib/state/editor-store";

import { LayerTree } from "./layer-tree";

/** Read/select view of the active screen's canonical component hierarchy. */
export function LayersPanel({
  project,
  screenId,
}: {
  project: ReactivelyProject;
  screenId: ScreenId;
}) {
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<ReadonlySet<NodeId>>(() => new Set());
  const selectedNodeId = useEditorStore((state) => state.selection.primaryNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);

  useEffect(() => {
    setCollapsedNodeIds(new Set());
  }, [project.id, screenId]);

  useEffect(() => {
    if (!selectedNodeId || !isNodeInScreenTree(project, screenId, selectedNodeId)) {
      return;
    }

    const ancestorIds = getAncestorIds(project, selectedNodeId);
    setCollapsedNodeIds((current) => {
      const next = new Set(current);
      let changed = false;

      for (const ancestorId of ancestorIds) {
        changed = next.delete(ancestorId) || changed;
      }

      return changed ? next : current;
    });
  }, [project, screenId, selectedNodeId]);

  const toggleNode = (nodeId: NodeId) => {
    setCollapsedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return (
    <ScrollArea className="h-full">
      <LayerTree
        project={project}
        screenId={screenId}
        selectedNodeId={selectedNodeId}
        collapsedNodeIds={collapsedNodeIds}
        onSelect={selectNode}
        onToggle={toggleNode}
      />
    </ScrollArea>
  );
}
