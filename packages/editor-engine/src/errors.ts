import type { NodeId } from "@reactively/project-schema";

/**
 * Mutations fail for expected reasons — a user dragged a Button into a Text node, or
 * tried to delete a screen root. Those are returned as values, not thrown, so the editor
 * can turn them into inline feedback.
 */
export type EditorErrorCode =
  | "invalid-project-name"
  | "screen-not-found"
  | "node-not-found"
  | "node-outside-screen"
  | "parent-not-found"
  | "parent-outside-screen"
  | "invalid-hierarchy"
  | "duplicate-node-id"
  | "unknown-component-type"
  | "invalid-component-style"
  | "unsupported-container-layout"
  | "invalid-nesting"
  | "cannot-delete-screen-root"
  | "cannot-reparent-screen-root"
  | "would-create-cycle";

export interface EditorError {
  readonly code: EditorErrorCode;
  readonly message: string;
  readonly nodeId?: NodeId;
}

export function editorError(code: EditorErrorCode, message: string, nodeId?: NodeId): EditorError {
  return nodeId === undefined ? { code, message } : { code, message, nodeId };
}
