import { getComponentDefinition } from "@reactively/component-registry";
import type { ComponentNode, NodeId } from "@reactively/project-schema";
import { ChevronDown, ChevronRight, MousePointerClick, Square, Type } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

const componentIcons: Readonly<Record<string, ComponentType<{ className?: string }>>> = {
  Square,
  Type,
  MousePointerClick,
};

/** One recursive row in the canonical component hierarchy. */
export function LayerNode({
  node,
  nodes,
  depth,
  selectedNodeId,
  collapsedNodeIds,
  onSelect,
  onToggle,
  ancestorIds,
}: {
  node: ComponentNode;
  nodes: Readonly<Record<string, ComponentNode>>;
  depth: number;
  selectedNodeId: NodeId | null;
  collapsedNodeIds: ReadonlySet<NodeId>;
  onSelect: (nodeId: NodeId) => void;
  onToggle: (nodeId: NodeId) => void;
  ancestorIds: ReadonlySet<NodeId>;
}) {
  const definition = getComponentDefinition(node.type);
  const label = definition?.label ?? node.type;
  const Icon = componentIcons[definition?.icon ?? ""] ?? Square;
  const canHaveChildren = definition?.capabilities.canHaveChildren ?? false;
  const isExpanded = !collapsedNodeIds.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const hasCycle = ancestorIds.has(node.id);

  const nextAncestorIds = new Set(ancestorIds);
  nextAncestorIds.add(node.id);

  return (
    <>
      <div
        role="treeitem"
        aria-level={depth + 2}
        aria-selected={isSelected}
        aria-expanded={canHaveChildren ? isExpanded : undefined}
        data-layer-node-id={node.id}
        data-layer-depth={depth}
        className={cn(
          "group flex h-8 min-w-0 items-center rounded-md pr-2 text-xs transition-colors",
          isSelected
            ? "bg-primary-soft font-medium text-primary"
            : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
        )}
        style={{ paddingLeft: `${8 + depth * 18}px` }}
      >
        {canHaveChildren ? (
          <button
            type="button"
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${label} layer`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            className="flex size-6 shrink-0 items-center justify-center rounded text-foreground-muted hover:bg-background/80 hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" aria-hidden />
            ) : (
              <ChevronRight className="size-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          aria-label={`Select ${node.name} layer`}
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 self-stretch text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </button>
      </div>

      {canHaveChildren && isExpanded && !hasCycle ? (
        <div role="group">
          {node.children.flatMap((childId) => {
            const child = nodes[childId];
            return child
              ? [
                  <LayerNode
                    key={child.id}
                    node={child}
                    nodes={nodes}
                    depth={depth + 1}
                    selectedNodeId={selectedNodeId}
                    collapsedNodeIds={collapsedNodeIds}
                    onSelect={onSelect}
                    onToggle={onToggle}
                    ancestorIds={nextAncestorIds}
                  />,
                ]
              : [];
          })}
        </div>
      ) : null}
    </>
  );
}
