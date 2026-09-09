import {
  DEFAULT_VIEWPORT,
  EMPTY_SELECTION,
  type EditorPanel,
  type EditorViewport,
  type InspectorPanel,
  type SelectionState,
} from "@reactively/editor-engine";
import type { NodeId, ScreenId } from "@reactively/project-schema";
import { create } from "zustand";

/**
 * EDITOR state: ephemeral, per-user, never saved.
 *
 * Selection, hover, zoom, pan, open panels, expanded layers and drag state describe how
 * someone is looking at a project, not what the project is. None of it belongs in
 * `ReactivelyProject`, and none of it should ever be serialized.
 */
export interface EditorStoreState {
  selection: SelectionState;
  viewport: EditorViewport;
  activePanel: EditorPanel;
  activeInspectorPanel: InspectorPanel;
  isDragging: boolean;
  /**
   * Number of open inspector dropdowns. Canvas clicks must not clear selection while
   * a dropdown is dismissing from a pointer-down on the canvas.
   */
  inspectorDropdownOpenCount: number;
  suppressNextCanvasClear: boolean;

  openScreen: (screenId: ScreenId) => void;
  selectNode: (nodeId: NodeId) => void;
  clearSelection: () => void;
  hoverNode: (nodeId: NodeId | null) => void;
  setActivePanel: (panel: EditorPanel) => void;
  setInspectorPanel: (panel: InspectorPanel) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  setDragging: (isDragging: boolean) => void;
  setInspectorDropdownOpen: (open: boolean) => void;
  armCanvasClearSuppression: () => void;
  consumeCanvasClearSuppression: () => boolean;
  reset: () => void;
}

/** Matches what a design tool allows: readable at 10%, useful up to 4x. */
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  selection: EMPTY_SELECTION,
  viewport: DEFAULT_VIEWPORT,
  activePanel: "layers",
  activeInspectorPanel: "properties",
  isDragging: false,
  inspectorDropdownOpenCount: 0,
  suppressNextCanvasClear: false,

  openScreen: (screenId) =>
    set((state) => ({
      selection: { ...state.selection, screenId, selectedNodeIds: [], primaryNodeId: null },
    })),

  selectNode: (nodeId) =>
    set((state) => ({
      selection: {
        ...state.selection,
        selectedNodeIds: [nodeId],
        primaryNodeId: nodeId,
      },
    })),

  clearSelection: () =>
    set((state) => ({
      selection: {
        ...state.selection,
        selectedNodeIds: [],
        primaryNodeId: null,
      },
    })),

  hoverNode: (nodeId) =>
    set((state) => ({ selection: { ...state.selection, hoveredNodeId: nodeId } })),

  setActivePanel: (activePanel) => set({ activePanel }),
  setInspectorPanel: (activeInspectorPanel) => set({ activeInspectorPanel }),

  setZoom: (zoom) =>
    set((state) => ({
      viewport: { ...state.viewport, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)) },
    })),

  setPan: (panX, panY) => set((state) => ({ viewport: { ...state.viewport, panX, panY } })),

  setDragging: (isDragging) => set({ isDragging }),

  setInspectorDropdownOpen: (open) =>
    set((state) => ({
      inspectorDropdownOpenCount: Math.max(0, state.inspectorDropdownOpenCount + (open ? 1 : -1)),
    })),

  armCanvasClearSuppression: () => {
    set({ suppressNextCanvasClear: true });
    window.setTimeout(() => {
      set({ suppressNextCanvasClear: false });
    }, 100);
  },

  consumeCanvasClearSuppression: () => {
    const shouldSuppress = get().suppressNextCanvasClear;
    if (shouldSuppress) {
      set({ suppressNextCanvasClear: false });
    }
    return shouldSuppress;
  },

  reset: () =>
    set({
      selection: EMPTY_SELECTION,
      viewport: DEFAULT_VIEWPORT,
      activePanel: "layers",
      activeInspectorPanel: "properties",
      isDragging: false,
      inspectorDropdownOpenCount: 0,
      suppressNextCanvasClear: false,
    }),
}));
