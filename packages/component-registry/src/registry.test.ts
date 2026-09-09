import { describe, expect, it } from "vitest";

import {
  SCREEN_PARENT_TYPE,
  canBeScreenRoot,
  canHaveChildren,
  canNest,
  checkNesting,
} from "./nesting.js";
import {
  getComponentDefinition,
  isKnownComponentType,
  listComponentDefinitions,
  requireComponentDefinition,
} from "./registry.js";

describe("component registry", () => {
  it("exposes the MVP primitives View, Text and Button", () => {
    const types = listComponentDefinitions().map((definition) => definition.type);
    expect(types).toEqual(["View", "Text", "Button"]);
  });

  it("looks components up by type", () => {
    expect(getComponentDefinition("View")?.label).toBe("View");
    expect(getComponentDefinition("Nonexistent")).toBeUndefined();
    expect(isKnownComponentType("Button")).toBe(true);
    expect(isKnownComponentType("FlatList")).toBe(false);
  });

  it("throws for unknown types when a definition is required", () => {
    expect(() => requireComponentDefinition("FlatList")).toThrow(/Unknown component type/);
  });

  it("gives every component a default prop set and default style", () => {
    for (const definition of listComponentDefinitions()) {
      expect(definition.defaultProps).toBeDefined();
      expect(definition.defaultStyle).toBeDefined();
      expect(definition.properties.length).toBeGreaterThan(0);
    }
  });

  it("exposes container Flexbox capability only for View", () => {
    expect(requireComponentDefinition("View").capabilities.supportsContainerLayout).toBe(true);
    expect(requireComponentDefinition("Text").capabilities.supportsContainerLayout).toBe(false);
    expect(requireComponentDefinition("Button").capabilities.supportsContainerLayout).toBe(false);
  });

  it("generates Button from Pressable + Text, not React Native's Button", () => {
    const button = requireComponentDefinition("Button");
    expect(button.generation.composesReactNative).toEqual(["Pressable", "Text"]);
    expect(button.generation.runtimeComponent).toBe("VNButton");
  });

  it("describes the first editable inspector fields without changing persisted prop keys", () => {
    const textProperty = requireComponentDefinition("Text").properties.find(
      (property) => property.id === "content",
    );
    const buttonProperty = requireComponentDefinition("Button").properties.find(
      (property) => property.id === "label",
    );

    expect(textProperty).toMatchObject({
      label: "Text",
      section: "Text Properties",
      target: "prop",
      path: "content",
      valueType: "string",
    });
    expect(buttonProperty).toMatchObject({
      label: "Title",
      section: "Button Properties",
      target: "prop",
      path: "label",
      valueType: "string",
    });
  });
});

describe("nesting rules", () => {
  it("lets View contain children", () => {
    expect(getComponentDefinition("View")?.capabilities.allowedChildTypes).toEqual([
      "View",
      "Text",
      "Button",
    ]);
    expect(canHaveChildren("View")).toBe(true);
    expect(canNest("View", "Text")).toBe(true);
    expect(canNest("View", "Button")).toBe(true);
    expect(canNest("View", "View")).toBe(true);
  });

  it("does not let Text contain arbitrary children", () => {
    expect(canHaveChildren("Text")).toBe(false);
    expect(canNest("Text", "Text")).toBe(false);
    expect(canNest("Text", "View")).toBe(false);
    expect(checkNesting("Text", "View").allowed).toBe(false);
    expect(checkNesting("Text", "View")).toEqual({
      allowed: false,
      reason: "parent-cannot-have-children",
    });
  });

  it("does not let Button contain arbitrary children", () => {
    expect(canHaveChildren("Button")).toBe(false);
    expect(canNest("Button", "Text")).toBe(false);
    expect(canNest("Button", "View")).toBe(false);
  });

  it("lets a screen root hold a View but not a Text or Button", () => {
    expect(canBeScreenRoot("View")).toBe(true);
    expect(canNest(SCREEN_PARENT_TYPE, "View")).toBe(true);
    expect(canNest(SCREEN_PARENT_TYPE, "Text")).toBe(false);
    expect(checkNesting(SCREEN_PARENT_TYPE, "Button")).toEqual({
      allowed: false,
      reason: "not-allowed-as-screen-root",
    });
  });

  it("rejects unknown component types on both sides", () => {
    expect(checkNesting("View", "Unknown")).toEqual({
      allowed: false,
      reason: "unknown-child-type",
    });
    expect(checkNesting("Unknown", "View")).toEqual({
      allowed: false,
      reason: "unknown-parent-type",
    });
  });
});
