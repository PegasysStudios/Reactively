import type { ComponentNode, ReactivelyProject } from "@reactively/project-schema";

/** Resolves the visual parent name without copying hierarchy into inspector state. */
export function getParentDisplayName(
  project: ReactivelyProject,
  node: ComponentNode,
): string {
  const screen = Object.values(project.screens).find(
    (candidate) =>
      candidate.rootNodeId === node.id || candidate.rootNodeId === node.parentId,
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
}: {
  project: ReactivelyProject;
  node: ComponentNode;
}) {
  const parentName = getParentDisplayName(project, node);

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
