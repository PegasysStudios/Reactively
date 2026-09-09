import type {
  ComponentNode,
  NodeId,
  ReactivelyProject,
  ScreenId,
} from "@reactively/project-schema";

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

/**
 * True when the screen's complete downward tree has consistent, unique two-way links.
 *
 * This is intentionally hierarchy-only. Component nesting semantics remain the registry's
 * responsibility, while mutations use this guard to avoid operating on corrupt arrays.
 */
export function isScreenTreeConsistent(project: ReactivelyProject, screenId: ScreenId): boolean {
  const screen = project.screens[screenId];
  const root = screen ? project.nodes[screen.rootNodeId] : undefined;
  if (!screen || !root || root.parentId !== null) {
    return false;
  }

  const visited = new Set<NodeId>();
  const stack: NodeId[] = [root.id];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) {
      return false;
    }
    visited.add(currentId);

    const current = project.nodes[currentId];
    if (!current || current.id !== currentId) {
      return false;
    }

    for (const childId of current.children) {
      const child = project.nodes[childId];
      if (!child || child.parentId !== current.id) {
        return false;
      }
    }

    stack.push(...[...current.children].reverse());
  }

  return Object.values(project.nodes).every(
    (candidate) =>
      !candidate.parentId || !visited.has(candidate.parentId) || visited.has(candidate.id),
  );
}

/**
 * True when a node has a consistent, acyclic parent path to the requested screen root.
 *
 * Following `parentId` keeps this query cheap while checking each matching `children`
 * reference preserves the document's two-way hierarchy invariant. A malformed cycle or
 * cross-screen reference therefore fails closed instead of becoming an insertion target.
 */
export function isNodeInScreenTree(
  project: ReactivelyProject,
  screenId: ScreenId,
  nodeId: NodeId,
): boolean {
  const screen = project.screens[screenId];
  if (!screen) {
    return false;
  }

  const seen = new Set<NodeId>();
  let currentId: NodeId | null = nodeId;

  while (currentId) {
    if (seen.has(currentId)) {
      return false;
    }
    seen.add(currentId);

    const current: ComponentNode | undefined = project.nodes[currentId];
    if (!current) {
      return false;
    }

    if (current.id === screen.rootNodeId) {
      return current.parentId === null;
    }

    if (!current.parentId) {
      return false;
    }

    const parent: ComponentNode | undefined = project.nodes[current.parentId];
    if (!parent?.children.includes(current.id)) {
      return false;
    }

    currentId = parent.id;
  }

  return false;
}
