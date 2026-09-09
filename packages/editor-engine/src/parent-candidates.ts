import type { NodeId, ReactivelyProject, ScreenId } from "@reactively/project-schema";

import type { EditorCommandContext } from "./context.js";
import { collectSubtreeIds, isNodeInScreenTree, isScreenTreeConsistent } from "./tree.js";

export type ParentCandidateKind = "screen" | "component";

export interface ParentCandidate {
  /** Canonical node ID written to the child's `parentId`. */
  readonly parentId: NodeId;
  readonly kind: ParentCandidateKind;
  readonly label: string;
}

export interface ValidParentCandidatesParams {
  readonly screenId: ScreenId;
  readonly nodeId: NodeId;
}

/**
 * Returns valid parent choices in canonical screen-tree order.
 *
 * The screen choice maps to the screen's existing root node; no synthetic component is
 * added to the document. Malformed or cross-screen source nodes fail closed.
 */
export function getValidParentCandidates(
  project: ReactivelyProject,
  context: Pick<EditorCommandContext, "canAcceptChild">,
  params: ValidParentCandidatesParams,
): readonly ParentCandidate[] {
  const screen = project.screens[params.screenId];
  const node = project.nodes[params.nodeId];
  const rootNode = screen ? project.nodes[screen.rootNodeId] : undefined;

  if (
    !screen ||
    !node ||
    !rootNode ||
    node.id === rootNode.id ||
    !isScreenTreeConsistent(project, screen.id) ||
    !isNodeInScreenTree(project, screen.id, node.id)
  ) {
    return [];
  }

  const excludedIds = new Set(collectSubtreeIds(project, node.id));
  const rawCandidates: Array<Omit<ParentCandidate, "label"> & { baseLabel: string }> = [];

  if (context.canAcceptChild(rootNode.type, node.type)) {
    rawCandidates.push({
      parentId: rootNode.id,
      kind: "screen",
      baseLabel: `${screen.name} (Screen)`,
    });
  }

  const stack = [...rootNode.children].reverse();
  const visited = new Set<NodeId>([rootNode.id]);
  while (stack.length > 0) {
    const candidateId = stack.pop();
    if (!candidateId || visited.has(candidateId)) {
      continue;
    }
    visited.add(candidateId);

    const candidate = project.nodes[candidateId];
    if (!candidate || !isNodeInScreenTree(project, screen.id, candidate.id)) {
      continue;
    }

    if (!excludedIds.has(candidate.id) && context.canAcceptChild(candidate.type, node.type)) {
      rawCandidates.push({
        parentId: candidate.id,
        kind: "component",
        baseLabel: candidate.name,
      });
    }

    stack.push(...[...candidate.children].reverse());
  }

  const labelCounts = new Map<string, number>();
  return rawCandidates.map(({ baseLabel, ...candidate }) => {
    const occurrence = (labelCounts.get(baseLabel) ?? 0) + 1;
    labelCounts.set(baseLabel, occurrence);
    return {
      ...candidate,
      label: occurrence === 1 ? baseLabel : `${baseLabel} · ${occurrence}`,
    };
  });
}
