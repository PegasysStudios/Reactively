import { canNest } from "@reactively/component-registry";
import { isNodeInScreenTree } from "@reactively/editor-engine";
import type { NodeId, ReactivelyProject, ScreenId } from "@reactively/project-schema";

/**
 * Resolves the UI's requested insertion target without storing hierarchy in editor state.
 *
 * A selected node is used only when it is on the active screen and the registry permits
 * the requested child type. Every other state deterministically falls back to the screen
 * root; the domain command validates the explicit result again before mutating.
 */
export function resolveComponentInsertionParent(options: {
  project: ReactivelyProject;
  screenId: ScreenId;
  selectedNodeId: NodeId | null;
  componentType: string;
}): NodeId | null {
  const { project, screenId, selectedNodeId, componentType } = options;
  const screen = project.screens[screenId];
  if (!screen) {
    return null;
  }

  if (!selectedNodeId || !isNodeInScreenTree(project, screenId, selectedNodeId)) {
    return screen.rootNodeId;
  }

  const selectedNode = project.nodes[selectedNodeId];
  return selectedNode && canNest(selectedNode.type, componentType)
    ? selectedNode.id
    : screen.rootNodeId;
}
