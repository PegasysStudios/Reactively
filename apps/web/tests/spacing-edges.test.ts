import { describe, expect, it } from "vitest";

import { withSpacingEdge } from "@/lib/editor/spacing-edges";

describe("withSpacingEdge", () => {
  it("sets only the requested edge", () => {
    expect(withSpacingEdge(undefined, "top", 16)).toEqual({ top: 16 });
  });

  it("preserves other explicit edges and shorthand", () => {
    expect(
      withSpacingEdge({ all: 8, horizontal: 20, top: 12, right: 16 }, "left", 24),
    ).toEqual({
      all: 8,
      horizontal: 20,
      top: 12,
      right: 16,
      left: 24,
    });
  });

  it("clears one edge without dropping the rest", () => {
    expect(withSpacingEdge({ top: 16, right: 20, bottom: 0 }, "right", undefined)).toEqual({
      top: 16,
      bottom: 0,
    });
  });

  it("returns undefined when the last edge is cleared", () => {
    expect(withSpacingEdge({ left: 24 }, "left", undefined)).toBeUndefined();
  });
});
