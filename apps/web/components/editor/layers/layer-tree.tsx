import type { NodeId, ReactivelyProject, ScreenId } from "@reactively/project-schema";
import { ChevronDown, PanelsTopLeft } from "lucide-react";

import { LayerNode } from "./layer-node";

/** Screen heading plus the ordered component children of its canonical root node. */
export function LayerTree({
  project,
  screenId,
  selectedNodeId,
  collapsedNodeIds,
  onSelect,
  onToggle,
}: {
  project: ReactivelyProject;
  screenId: ScreenId;
  selectedNodeId: NodeId | null;
  collapsedNodeIds: ReadonlySet<NodeId>;
  onSelect: (nodeId: NodeId) => void;
  onToggle: (nodeId: NodeId) => void;
}) {
  const screen = project.screens[screenId];
  const rootNode = screen ? project.nodes[screen.rootNodeId] : undefined;

  if (!screen || !rootNode) {
    return <p className="px-3 pb-3 text-xs text-foreground-muted">No components</p>;
  }

  return (
    <div role="tree" aria-label={`${screen.name} layers`} className="px-2 pb-3">
      <div
        role="treeitem"
        aria-level={1}
        aria-expanded="true"
        className="flex h-8 items-center gap-2 rounded-md px-2 text-xs font-medium text-foreground"
      >
        <ChevronDown className="size-3.5 text-foreground-muted" aria-hidden />
        <PanelsTopLeft className="size-3.5 text-foreground-muted" aria-hidden />
        <span className="truncate">{screen.name} (Screen)</span>
      </div>

      {rootNode.children.length > 0 ? (
        <div role="group">
          {rootNode.children.flatMap((nodeId) => {
            const node = project.nodes[nodeId];
            return node
              ? [
                  <LayerNode
                    key={node.id}
                    node={node}
                    nodes={project.nodes}
                    depth={0}
                    selectedNodeId={selectedNodeId}
                    collapsedNodeIds={collapsedNodeIds}
                    onSelect={onSelect}
                    onToggle={onToggle}
                    ancestorIds={new Set([rootNode.id])}
                  />,
                ]
              : [];
          })}
        </div>
      ) : (
        <p className="py-2 pl-10 text-xs text-foreground-muted">No components</p>
      )}
    </div>
  );
}
