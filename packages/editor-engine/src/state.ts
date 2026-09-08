import type { NodeId, ScreenId } from "@reactively/project-schema";

/**
 * Ephemeral editor state.
 *
 * None of this is ever serialized into a `ReactivelyProject`. Selection, hover, zoom and
 * drag describe how someone is looking at the document, not what the document is —
 * persisting them would make two people editing the same project produce different files.
 * See docs/ARCHITECTURE.md.
 */

/** Multi-select is modelled from the start so it never has to be retrofitted. */
export interface SelectionState {
  readonly screenId: ScreenId | null;
  readonly selectedNodeIds: readonly NodeId[];
  /** Anchor for range selection and for the inspector's "primary" target. */
  readonly primaryNodeId: NodeId | null;
  readonly hoveredNodeId: NodeId | null;
}

export const EMPTY_SELECTION: SelectionState = {
  screenId: null,
  selectedNodeIds: [],
  primaryNodeId: null,
  hoveredNodeId: null,
};

/**
 * Canvas viewport transform.
 *
 * Document coordinates stay independent of display zoom: the canvas converts
 * document -> viewport -> screen pixels at draw time.
 */
export interface EditorViewport {
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  /** Device frame the canvas is simulating, e.g. an iPhone in portrait. */
  readonly deviceWidth: number;
  readonly deviceHeight: number;
}

export const DEFAULT_VIEWPORT: EditorViewport = {
  zoom: 1,
  panX: 0,
  panY: 0,
  deviceWidth: 390,
  deviceHeight: 844,
};

/** Which top-level inspector tab is open. Ephemeral, per-user. */
export type InspectorPanel = "properties" | "style";

/** Which left-hand panel is open. */
export type EditorPanel = "screens" | "layers" | "components";

/** Converts document coordinates to viewport coordinates. */
export function documentToViewport(
  viewport: EditorViewport,
  point: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: point.x * viewport.zoom + viewport.panX,
    y: point.y * viewport.zoom + viewport.panY,
  };
}

/** Converts viewport coordinates back to document coordinates. */
export function viewportToDocument(
  viewport: EditorViewport,
  point: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: (point.x - viewport.panX) / viewport.zoom,
    y: (point.y - viewport.panY) / viewport.zoom,
  };
}
