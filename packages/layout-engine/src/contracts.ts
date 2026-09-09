import type { ComponentStyle, NodeId } from "@reactively/project-schema";

/**
 * Reactively's visual layout semantics intentionally target React Native Flexbox
 * (Yoga), not CSS Flexbox.
 *
 * The two differ in defaults and in a handful of behaviours, and the editor is only
 * useful if what the designer sees matches what ships. Concretely:
 *
 * - `flexDirection` defaults to `column`, not `row`
 * - `alignItems` defaults to `stretch`
 * - `flexShrink` defaults to `0` (CSS defaults to `1`)
 * - `position` defaults to `relative`, and absolute children are positioned against
 *   their parent regardless of the parent's own `position`
 * - there is no `float`, no `display: grid`, no `z-index` stacking context in the CSS
 *   sense, and percentages resolve against the parent's resolved size only
 *
 * The long-term intent is to run Yoga itself in the editor rather than maintain a
 * Flexbox reimplementation. This package therefore defines the contracts and the pure
 * normalization utilities; the solver is deliberately absent until it can be validated
 * against real React Native output. See docs/LAYOUT_ENGINE.md.
 */
export const REACT_NATIVE_LAYOUT_DEFAULTS = {
  position: "relative",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
  alignSelf: "auto",
  flexWrap: "nowrap",
  flexGrow: 0,
  flexShrink: 0,
  gap: 0,
} as const satisfies Partial<ComponentStyle>;

/** An axis-aligned rectangle in document coordinates. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Concrete per-edge spacing after shorthand resolution. */
export interface ResolvedEdges {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * The geometry the canvas renders.
 *
 * Coordinates are in document units and independent of zoom or pan: the viewport
 * transform is applied at draw time so a zoom change never invalidates layout.
 */
export interface ComputedLayoutNode {
  readonly nodeId: NodeId;
  /** Position in document coordinates, relative to the screen origin. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Area inside padding and borders, where children are laid out. */
  readonly contentBox: Rect;
  /** Present when an ancestor's `overflow` clips this node. */
  readonly clippingRect?: Rect;
}

/** The viewport a screen is laid out against, e.g. an iPhone in portrait. */
export interface LayoutViewport {
  readonly width: number;
  readonly height: number;
  /** Insets contributed by notches, status bars and home indicators. */
  readonly safeAreaInsets: ResolvedEdges;
}

export interface LayoutRequest {
  readonly rootNodeId: NodeId;
  readonly viewport: LayoutViewport;
}

export interface LayoutResult {
  /** Computed geometry keyed by node ID. */
  readonly nodes: Readonly<Record<NodeId, ComputedLayoutNode>>;
}

/**
 * Contract for the eventual solver.
 *
 * Declared now so the editor, the canvas renderer and the future Yoga-backed
 * implementation can be written against a stable interface.
 */
export interface LayoutEngine {
  computeLayout(request: LayoutRequest): LayoutResult;
}
