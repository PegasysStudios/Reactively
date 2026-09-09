import {
  createProjectCommand,
  type EditorError,
  type MutationResult,
} from "@reactively/editor-engine";
import { HistoryManager } from "@reactively/history";
import type { ComponentNode, NodeId, ReactivelyProject } from "@reactively/project-schema";
import { create } from "zustand";

import { createEditorCommandContext } from "@/lib/editor/command-context";

/**
 * PROJECT state: the persistent document.
 *
 * Everything here is saved and, eventually, synced. Selection, hover, zoom and drag are
 * *not* here — they live in `useEditorStore`. Keeping them apart is what stops ephemeral
 * UI state from leaking into saved files and producing spurious diffs.
 *
 * React components must not call the mutation operations directly. They go through
 * `lib/state/project-commands.ts`, which is what routes every change through history and
 * dirty tracking:
 *
 *     UI -> command -> project store -> { canvas, history, dirty state, cloud sync }
 */

/**
 * The undo stack is a module-level instance rather than store state.
 *
 * It is a mutable object whose identity never changes, so putting it in the store would
 * only produce no-op re-renders. Components read `canUndo`/`canRedo`, which are mirrored
 * into state whenever they change.
 */
const history = new HistoryManager<ReactivelyProject>();
const commandContext = createEditorCommandContext();

export interface ProjectStoreState {
  project: ReactivelyProject | null;
  /** True when there are unsaved changes. Drives the debounced local write. */
  isDirty: boolean;
  /** Most recent rejected mutation, e.g. an invalid drop target. */
  lastError: EditorError | null;
  canUndo: boolean;
  canRedo: boolean;

  /** Installs a newly created document in memory and marks it for persistence. */
  createProject: (project: ReactivelyProject) => void;
  /** Replaces the document, e.g. after loading from IndexedDB. Clears history. */
  loadProject: (project: ReactivelyProject) => void;
  clearProject: () => void;

  /**
   * Applies a mutation through the history stack.
   *
   * Returns true when the mutation was applied. Failures are expected (invalid nesting,
   * deleting a screen root) and surface through `lastError` rather than throwing.
   */
  applyMutation: (
    label: string,
    mutate: (project: ReactivelyProject, context: typeof commandContext) => MutationResult,
    commandType?: string,
  ) => boolean;

  undo: () => void;
  redo: () => void;
  /** Called by the persistence layer once the document has been written. */
  markSaved: () => void;
  clearError: () => void;
}

/** Resolves a node from the canonical project document without copying project data. */
export function selectProjectNode(
  state: Pick<ProjectStoreState, "project">,
  nodeId: NodeId | null,
): ComponentNode | null {
  return nodeId ? (state.project?.nodes[nodeId] ?? null) : null;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: null,
  isDirty: false,
  lastError: null,
  canUndo: false,
  canRedo: false,

  createProject: (project) => {
    history.clear();
    set({ project, isDirty: true, lastError: null, canUndo: false, canRedo: false });
  },

  loadProject: (project) => {
    history.clear();
    set({ project, isDirty: false, lastError: null, canUndo: false, canRedo: false });
  },

  clearProject: () => {
    history.clear();
    set({ project: null, isDirty: false, lastError: null, canUndo: false, canRedo: false });
  },

  applyMutation: (label, mutate, commandType = label) => {
    const current = get().project;
    if (!current) {
      return false;
    }

    const result = mutate(current, commandContext);
    if (!result.ok) {
      set({ lastError: result.error });
      return false;
    }

    if (result.value === current) {
      set({ lastError: null });
      return true;
    }

    const next = history.execute(
      current,
      createProjectCommand({
        type: commandType,
        label,
        before: current,
        after: result.value,
      }),
    );

    set({
      project: next,
      isDirty: true,
      lastError: null,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    });
    return true;
  },

  undo: () => {
    const current = get().project;
    if (!current || !history.canUndo) {
      return;
    }

    set({
      project: history.undo(current),
      isDirty: true,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    });
  },

  redo: () => {
    const current = get().project;
    if (!current || !history.canRedo) {
      return;
    }

    set({
      project: history.redo(current),
      isDirty: true,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    });
  },

  markSaved: () => set({ isDirty: false }),
  clearError: () => set({ lastError: null }),
}));
