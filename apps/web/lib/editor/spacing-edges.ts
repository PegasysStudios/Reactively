import type { EdgeValues } from "@reactively/project-schema";

export const SPACING_EDGES = ["top", "right", "bottom", "left"] as const;

export type SpacingEdge = (typeof SPACING_EDGES)[number];

/**
 * Updates one explicit spacing edge on the canonical `EdgeValues` object.
 *
 * Shorthand keys (`all`, `horizontal`, `vertical`) stay in place so editing Left does
 * not flatten or contradict existing axis/all values. Clearing a side omits that key;
 * an empty object becomes `undefined` so the document does not store `{}`.
 */
export function withSpacingEdge(
  edges: EdgeValues | undefined,
  edge: SpacingEdge,
  value: number | undefined,
): EdgeValues | undefined {
  const next: EdgeValues = { ...edges, [edge]: value };
  const pruned = Object.fromEntries(
    Object.entries(next).filter(([, entry]) => entry !== undefined),
  ) as EdgeValues;

  return Object.keys(pruned).length > 0 ? pruned : undefined;
}
