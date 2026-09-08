import { resolveEdgeValues, toReactNativeDimension } from "@reactively/layout-engine";
import type { ComponentStyle, EdgeValues, LayoutValue } from "@reactively/project-schema";
import type { CSSProperties } from "react";

/**
 * Translates canonical React Native layout fields into CSS for the editor surface.
 *
 * The project document stays RN-oriented. This mapping is visualization only and is
 * not persisted. Margin is applied on the node wrapper (outer spacing). Padding is
 * mapped separately onto the visual surface so it insets content, not the box.
 */
export function componentStyleToEditorCss(style: ComponentStyle): CSSProperties {
  const css: CSSProperties = {};

  if (style.position === "absolute") {
    css.position = "absolute";
    assignDimension(css, "left", style.left);
    assignDimension(css, "top", style.top);
  }

  assignDimension(css, "width", style.width);
  assignDimension(css, "height", style.height);
  assignEdges(css, "margin", style.margin);

  if (style.flexGrow !== undefined) {
    css.flexGrow = style.flexGrow;
  }

  if (style.flexShrink !== undefined) {
    css.flexShrink = style.flexShrink;
  }

  if (style.alignSelf !== undefined) {
    css.alignSelf = style.alignSelf;
  }

  return css;
}

/** Padding CSS for the component's visual surface, derived from project style. */
export function componentPaddingToEditorCss(style: ComponentStyle): CSSProperties {
  const css: CSSProperties = {};
  assignEdges(css, "padding", style.padding);
  return css;
}

function assignDimension(
  css: CSSProperties,
  property: "left" | "top" | "width" | "height",
  value: LayoutValue | undefined,
): void {
  if (!value) {
    return;
  }

  css[property] = toReactNativeDimension(value);
}

function assignEdges(
  css: CSSProperties,
  kind: "margin" | "padding",
  edges: EdgeValues | undefined,
): void {
  if (!edges) {
    return;
  }

  const resolved = resolveEdgeValues(edges);

  if (kind === "margin") {
    css.marginTop = resolved.top;
    css.marginRight = resolved.right;
    css.marginBottom = resolved.bottom;
    css.marginLeft = resolved.left;
    return;
  }

  css.paddingTop = resolved.top;
  css.paddingRight = resolved.right;
  css.paddingBottom = resolved.bottom;
  css.paddingLeft = resolved.left;
}
