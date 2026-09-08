import { auto, percent, points } from "@reactively/project-schema";
import { describe, expect, it } from "vitest";

import {
  insetRect,
  resolveEdgeValues,
  resolveLayoutValue,
  toReactNativeDimension,
} from "./normalize.js";

describe("resolveEdgeValues", () => {
  it("returns zeroes when spacing is unset", () => {
    expect(resolveEdgeValues(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("expands the `all` shorthand", () => {
    expect(resolveEdgeValues({ all: 8 })).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
  });

  it("lets axis shorthand override `all`", () => {
    expect(resolveEdgeValues({ all: 8, horizontal: 20 })).toEqual({
      top: 8,
      right: 20,
      bottom: 8,
      left: 20,
    });
  });

  it("lets explicit edges override axis shorthand", () => {
    expect(resolveEdgeValues({ horizontal: 20, vertical: 12, top: 0 })).toEqual({
      top: 0,
      right: 20,
      bottom: 12,
      left: 20,
    });
  });
});

describe("toReactNativeDimension", () => {
  it("maps the layout value union onto React Native style values", () => {
    expect(toReactNativeDimension(points(120))).toBe(120);
    expect(toReactNativeDimension(percent(50))).toBe("50%");
    expect(toReactNativeDimension(auto())).toBe("auto");
  });
});

describe("resolveLayoutValue", () => {
  it("resolves percentages against the parent size", () => {
    expect(resolveLayoutValue(percent(50), 400)).toBe(200);
    expect(resolveLayoutValue(points(64), 400)).toBe(64);
  });

  it("leaves auto and unset sizes to the solver", () => {
    expect(resolveLayoutValue(auto(), 400)).toBeUndefined();
    expect(resolveLayoutValue(undefined, 400)).toBeUndefined();
  });
});

describe("insetRect", () => {
  it("shrinks a rect by its edges", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    expect(insetRect(rect, { top: 10, right: 5, bottom: 10, left: 5 })).toEqual({
      x: 5,
      y: 10,
      width: 90,
      height: 80,
    });
  });

  it("clamps at zero rather than producing a negative box", () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(insetRect(rect, { top: 20, right: 20, bottom: 20, left: 20 })).toEqual({
      x: 20,
      y: 20,
      width: 0,
      height: 0,
    });
  });
});
