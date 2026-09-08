import type { NodeId, ReactivelyProject } from "@reactively/project-schema";

/**
 * Pure tree queries over a project document.
 *
 * These are shared by mutations, validation feedback in the editor, the layers panel and
 * the future canvas hit-testing, so they live here rather than being reimplemented in
 * each consumer.
 */

/** Node IDs from the given node up to its screen root, nearest ancestor first. */
export function getAncestorIds(project: ReactivelyProject, nodeId: NodeId): NodeId[] {
  const ancestors: NodeId[] = [];
  const seen = new Set<NodeId>([nodeId]);

  let currentId = project.nodes[nodeId]?.parentId ?? null;
  while (currentId && !seen.has(currentId)) {
    ancestors.push(currentId);
    seen.add(currentId);
    currentId = project.nodes[currentId]?.parentId ?? null;
  }

  return ancestors;
}

/** True when `candidateAncestorId` is anywhere above `nodeId`. */
export function isAncestorOf(
  project: ReactivelyProject,
  candidateAncestorId: NodeId,
  nodeId: NodeId,
): boolean {
  return getAncestorIds(project, nodeId).includes(candidateAncestorId);
}

/** The node plus every descendant, in depth-first order. */
export function collectSubtreeIds(project: ReactivelyProject, nodeId: NodeId): NodeId[] {
  const collected: NodeId[] = [];
  const stack: NodeId[] = [nodeId];
  const seen = new Set<NodeId>();

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (currentId === undefined || seen.has(currentId)) {
      continue;
    }

    seen.add(currentId);
    collected.push(currentId);

    const node = project.nodes[currentId];
    if (node) {
      // Reverse so children are visited left-to-right despite the LIFO stack.
      stack.push(...[...node.children].reverse());
    }
  }

  return collected;
}

/** IDs of every node that is the root of some screen. */
export function getScreenRootIds(project: ReactivelyProject): Set<NodeId> {
  return new Set(Object.values(project.screens).map((screen) => screen.rootNodeId));
}

export function isScreenRoot(project: ReactivelyProject, nodeId: NodeId): boolean {
  return getScreenRootIds(project).has(nodeId);
}
