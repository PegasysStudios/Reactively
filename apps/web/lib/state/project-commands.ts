import {
  addNode,
  deleteNode,
  renameProject,
  reparentComponent,
  updateNodeProps,
  updateNodeStyle,
} from "@reactively/editor-engine";
import type { ComponentStyle, NodeId, ScreenId } from "@reactively/project-schema";

import { saveCurrentProjectLocally } from "@/lib/projects/local-project-lifecycle";

import { useProjectStore } from "./project-store";

/**
 * The command layer.
 *
 * This is the only surface React components use to change a project. Components never
 * call `useProjectStore.setState` and never call the mutation operations directly —
 * routing everything through here is what guarantees that undo, dirty tracking, autosave
 * and (later) cloud sync see every change.
 *
 *     UI -> projectCommands -> project store -> { canvas, history, dirty, sync }
 *
 * Labels are user-facing: they appear in the history panel and in undo affordances.
 */
export const projectCommands = {
  async renameProject(name: string): Promise<boolean> {
    const applied = useProjectStore
      .getState()
      .applyMutation("Rename project", (project, context) =>
        renameProject(project, context, { name }),
      );

    if (!applied) {
      return false;
    }

    await saveCurrentProjectLocally();
    return true;
  },

  async addComponent(params: {
    screenId: ScreenId;
    parentId: NodeId;
    type: string;
    index?: number;
  }): Promise<boolean> {
    const applied = useProjectStore
      .getState()
      .applyMutation(`Add ${params.type}`, (project, context) => addNode(project, context, params));

    if (!applied) {
      return false;
    }

    await saveCurrentProjectLocally();
    return true;
  },

  removeComponent(params: { nodeId: NodeId }): boolean {
    return useProjectStore
      .getState()
      .applyMutation("Delete component", (project, context) =>
        deleteNode(project, context, params),
      );
  },

  async reparentComponent(params: {
    screenId: ScreenId;
    nodeId: NodeId;
    newParentId: NodeId;
  }): Promise<boolean> {
    const before = useProjectStore.getState().project;
    const applied = useProjectStore
      .getState()
      .applyMutation("Move component", (project, context) =>
        reparentComponent(project, context, params),
      );

    if (!applied) {
      return false;
    }

    if (useProjectStore.getState().project !== before) {
      await saveCurrentProjectLocally();
    }
    return true;
  },

  async updateComponentProps(params: {
    nodeId: NodeId;
    props: Record<string, unknown>;
  }): Promise<boolean> {
    const applied = useProjectStore
      .getState()
      .applyMutation("Update properties", (project, context) =>
        updateNodeProps(project, context, params),
      );

    if (!applied) {
      return false;
    }

    await saveCurrentProjectLocally();
    return true;
  },

  async updateComponentStyle(params: { nodeId: NodeId; style: ComponentStyle }): Promise<boolean> {
    const applied = useProjectStore
      .getState()
      .applyMutation("Update style", (project, context) =>
        updateNodeStyle(project, context, params),
      );

    if (!applied) {
      return false;
    }

    await saveCurrentProjectLocally();
    return true;
  },

  undo(): void {
    useProjectStore.getState().undo();
  },

  redo(): void {
    useProjectStore.getState().redo();
  },
} as const;
