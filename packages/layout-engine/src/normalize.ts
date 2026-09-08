import type { EdgeValues, LayoutValue } from "@reactively/project-schema";
import { assertNever } from "@reactively/shared";

import type { ResolvedEdges } from "./contracts.js";

const NO_EDGES: ResolvedEdges = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Collapses spacing shorthand into concrete per-edge values.
 *
 * Specificity runs weakest to strongest: `all`, then `horizontal`/`vertical`, then the
 * individual edges. The document keeps the user's shorthand so the inspector can still
 * show "padding: 16" instead of four identical numbers; only the layout and generation
 * pipelines see the expanded form.
 */
export function resolveEdgeValues(edges: EdgeValues | undefined): ResolvedEdges {
  if (!edges) {
    return NO_EDGES;
  }

  const all = edges.all ?? 0;
  const horizontal = edges.horizontal ?? all;
  const vertical = edges.vertical ?? all;

  return {
    top: edges.top ?? vertical,
    right: edges.right ?? horizontal,
    bottom: edges.bottom ?? vertical,
    left: edges.left ?? horizontal,
  };
}

/** A dimension in the form React Native's style system accepts. */
export type ReactNativeDimension = number | `${number}%` | "auto";

/**
 * Converts a document layout value into a React Native style value.
 *
 * This is the only place the `{ type: "percent" }` representation becomes the `"50%"`
 * string React Native expects, which keeps percentage handling identical between the
 * canvas, the preview and generated source.
 */
export function toReactNativeDimension(value: LayoutValue): ReactNativeDimension {
  switch (value.type) {
    case "points":
      return value.value;
    case "percent":
      return `${value.value}%`;
    case "auto":
      return "auto";
    default:
      return assertNever(value, "Unhandled layout value");
  }
}

/** Resolves a layout value against a known parent size, in document units. */
export function resolveLayoutValue(
  value: LayoutValue | undefined,
  parentSize: number,
): number | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.type) {
    case "points":
      return value.value;
    case "percent":
      return (value.value / 100) * parentSize;
    case "auto":
      return undefined;
    default:
      return assertNever(value, "Unhandled layout value");
  }
}

/** Shrinks a rectangle by the given edge insets, clamping at zero. */
export function insetRect(
  rect: { x: number; y: number; width: number; height: number },
  edges: ResolvedEdges,
): { x: number; y: number; width: number; height: number } {
  return {
    x: rect.x + edges.left,
    y: rect.y + edges.top,
    width: Math.max(0, rect.width - edges.left - edges.right),
    height: Math.max(0, rect.height - edges.top - edges.bottom),
  };
}
