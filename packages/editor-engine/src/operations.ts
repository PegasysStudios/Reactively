import type {
  ComponentNode,
  ComponentStyle,
  NodeId,
  ReactivelyProject,
} from "@reactively/project-schema";
import { err, ok, type Result } from "@reactively/shared";

import type { EditorCommandContext } from "./context.js";
import { editorError, type EditorError } from "./errors.js";
import { collectSubtreeIds, isAncestorOf, isScreenRoot } from "./tree.js";

/**
 * Pure project mutations.
 *
 * Each operation takes a project and returns a new one; nothing is mutated in place.
 * These are the primitives that @reactively/history commands and the web app's
 * `projectCommands` layer are built from — React components never call them directly.
 */

export type MutationResult = Result<ReactivelyProject, EditorError>;

/** Stamps `metadata.updatedAt` so persistence and sync can detect staleness. */
function touch(project: ReactivelyProject, context: EditorCommandContext): ReactivelyProject {
  return {
    ...project,
    metadata: { ...project.metadata, updatedAt: context.now() },
  };
}

function replaceNodes(
  project: ReactivelyProject,
  nodes: Record<NodeId, ComponentNode>,
  context: EditorCommandContext,
): ReactivelyProject {
  return touch({ ...project, nodes }, context);
}

export interface RenameProjectParams {
  readonly name: string;
}

/** Renames the project while keeping the generated application's display name separate. */
export function renameProject(
  project: ReactivelyProject,
  context: EditorCommandContext,
  params: RenameProjectParams,
): MutationResult {
  const name = params.name.trim();
  if (!name) {
    return err(editorError("invalid-project-name", "Project name must not be empty."));
  }

  return ok(touch({ ...project, name }, context));
}

/** Inserts `childId` into a parent's children at `index`, or appends when omitted. */
function insertChild(children: readonly NodeId[], childId: NodeId, index?: number): NodeId[] {
  const next = [...children];
  const position = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
  next.splice(position, 0, childId);
  return next;
}

export interface AddNodeParams {
  readonly parentId: NodeId;
  readonly type: string;
  /** Position among the parent's children. Appended when omitted. */
  readonly index?: number;
  /** Overrides the registry-provided default name. */
  readonly name?: string;
}

/**
 * Creates a node from its component defaults and attaches it to a parent.
 *
 * Rejects rather than silently repairing: an invalid drop target is a user-facing
 * message, not something to work around.
 */
export function addNode(
  project: ReactivelyProject,
  context: EditorCommandContext,
  params: AddNodeParams,
): MutationResult {
  const parent = project.nodes[params.parentId];
  if (!parent) {
    return err(editorError("parent-not-found", `Parent node "${params.parentId}" does not exist.`));
  }

  const defaults = context.defaultsFor(params.type);
  if (!defaults) {
    return err(editorError("unknown-component-type", `Unknown component type "${params.type}".`));
  }

  if (!context.canAcceptChild(parent.type, params.type)) {
    return err(
      editorError(
        "invalid-nesting",
        `"${params.type}" cannot be placed inside "${parent.type}".`,
        params.parentId,
      ),
    );
  }

  const nodeId = context.createId();
  const node: ComponentNode = {
    id: nodeId,
    type: params.type,
    name: params.name ?? defaults.name,
    parentId: parent.id,
    children: [],
    props: { ...defaults.props },
    style: { ...defaults.style },
    events: [],
  };

  return ok(
    replaceNodes(
      project,
      {
        ...project.nodes,
        [parent.id]: {
          ...parent,
          children: insertChild(parent.children, nodeId, params.index),
        },
        [nodeId]: node,
      },
      context,
    ),
  );
}

export interface DeleteNodeParams {
  readonly nodeId: NodeId;
}

/**
 * Removes a node and its entire subtree.
 *
 * Screen roots are protected: deleting one would leave a screen with nothing to render,
 * so the caller must delete the screen instead.
 */
export function deleteNode(
  project: ReactivelyProject,
  context: EditorCommandContext,
  params: DeleteNodeParams,
): MutationResult {
  const node = project.nodes[params.nodeId];
  if (!node) {
    return err(editorError("node-not-found", `Node "${params.nodeId}" does not exist.`));
  }

  if (isScreenRoot(project, params.nodeId)) {
    return err(
      editorError(
        "cannot-delete-screen-root",
        "A screen's root node cannot be deleted. Delete the screen instead.",
        params.nodeId,
      ),
    );
  }

  const removedIds = new Set(collectSubtreeIds(project, params.nodeId));
  const nodes: Record<NodeId, ComponentNode> = {};

  for (const [id, candidate] of Object.entries(project.nodes)) {
    if (removedIds.has(id)) {
      continue;
    }
    nodes[id] = candidate.children.some((childId) => removedIds.has(childId))
      ? { ...candidate, children: candidate.children.filter((childId) => !removedIds.has(childId)) }
      : candidate;
  }

  return ok(replaceNodes(project, nodes, context));
}

export interface ReparentNodeParams {
  readonly nodeId: NodeId;
  readonly newParentId: NodeId;
  /** Position among the new parent's children. Appended when omitted. */
  readonly index?: number;
}

/** Moves a node to a different parent, or to a different position under the same parent. */
export function reparentNode(
  project: ReactivelyProject,
  context: EditorCommandContext,
  params: ReparentNodeParams,
): MutationResult {
  const node = project.nodes[params.nodeId];
  if (!node) {
    return err(editorError("node-not-found", `Node "${params.nodeId}" does not exist.`));
  }

  const newParent = project.nodes[params.newParentId];
  if (!newParent) {
    return err(
      editorError("parent-not-found", `Parent node "${params.newParentId}" does not exist.`),
    );
  }

  if (isScreenRoot(project, params.nodeId)) {
    return err(
      editorError(
        "cannot-reparent-screen-root",
        "A screen's root node cannot be moved.",
        params.nodeId,
      ),
    );
  }

  if (params.nodeId === params.newParentId) {
    return err(
      editorError("would-create-cycle", "A node cannot be its own parent.", params.nodeId),
    );
  }

  if (isAncestorOf(project, params.nodeId, params.newParentId)) {
    return err(
      editorError(
        "would-create-cycle",
        "A node cannot be moved inside one of its own descendants.",
        params.nodeId,
      ),
    );
  }

  if (!context.canAcceptChild(newParent.type, node.type)) {
    return err(
      editorError(
        "invalid-nesting",
        `"${node.type}" cannot be placed inside "${newParent.type}".`,
        params.newParentId,
      ),
    );
  }

  const nodes = { ...project.nodes };

  const oldParentId = node.parentId;
  if (oldParentId) {
    const oldParent = nodes[oldParentId];
    if (oldParent) {
      nodes[oldParentId] = {
        ...oldParent,
        children: oldParent.children.filter((childId) => childId !== params.nodeId),
      };
    }
  }

  // Read the new parent back out of `nodes`: it may be the same object we just rewrote
  // when a node is reordered within its current parent.
  const targetParent = nodes[params.newParentId] ?? newParent;
  nodes[params.newParentId] = {
    ...targetParent,
    children: insertChild(targetParent.children, params.nodeId, params.index),
  };
  nodes[params.nodeId] = { ...node, parentId: params.newParentId };

  return ok(replaceNodes(project, nodes, context));
}

export interface UpdateNodePropsParams {
  readonly nodeId: NodeId;
  /** Shallow-merged over existing props. `undefined` removes a key. */
  readonly props: Readonly<Record<string, unknown>>;
}

/** Merges prop changes into a node. */
export function updateNodeProps(
  project: ReactivelyProject,
  context: EditorCommandContext,
  params: UpdateNodePropsParams,
): MutationResult {
  const node = project.nodes[params.nodeId];
  if (!node) {
    return err(editorError("node-not-found", `Node "${params.nodeId}" does not exist.`));
  }

  return ok(
    replaceNodes(
      project,
      {
        ...project.nodes,
        [params.nodeId]: { ...node, props: pruneUndefined({ ...node.props, ...params.props }) },
      },
      context,
    ),
  );
}

export interface UpdateNodeStyleParams {
  readonly nodeId: NodeId;
  /** Shallow-merged over the existing style. `undefined` clears a property. */
  readonly style: ComponentStyle;
}

/** Merges style changes into a node. */
export function updateNodeStyle(
  project: ReactivelyProject,
  context: EditorCommandContext,
  params: UpdateNodeStyleParams,
): MutationResult {
  const node = project.nodes[params.nodeId];
  if (!node) {
    return err(editorError("node-not-found", `Node "${params.nodeId}" does not exist.`));
  }

  return ok(
    replaceNodes(
      project,
      {
        ...project.nodes,
        [params.nodeId]: { ...node, style: pruneUndefined({ ...node.style, ...params.style }) },
      },
      context,
    ),
  );
}

/**
 * Drops keys explicitly set to `undefined`.
 *
 * "Clear this style property" and "this property is absent" must serialize identically,
 * otherwise the document accumulates `{"gap": undefined}` noise that changes JSON output
 * without changing the app.
 */
function pruneUndefined<TValue extends Record<string, unknown>>(value: TValue): TValue {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return Object.fromEntries(entries) as TValue;
}
