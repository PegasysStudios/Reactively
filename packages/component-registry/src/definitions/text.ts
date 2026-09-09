import { universalSupport } from "@reactively/platform";

import type { ComponentDefinition } from "../contracts.js";

/**
 * Text renders a string.
 *
 * React Native allows nesting `Text` inside `Text` for rich formatting, but for the MVP
 * Reactively treats Text as a leaf: its content is a property, not a child tree. Rich
 * text becomes a dedicated feature later rather than an accidental capability of the
 * hierarchy editor.
 */
export const textDefinition: ComponentDefinition = {
  type: "Text",
  label: "Text",
  category: "Content",
  description: "Displays a string of text.",
  icon: "Type",

  capabilities: {
    canHaveChildren: false,
    allowedChildTypes: [],
    supportsAbsolutePosition: true,
    supportsContainerLayout: false,
    supportsFlexItem: true,
    supportsTextStyle: true,
    supportsEvents: ["onPress"],
    canBeScreenRoot: false,
  },

  properties: [
    {
      id: "content",
      label: "Text",
      section: "Text Properties",
      valueType: "string",
      target: "prop",
      path: "content",
    },
    {
      id: "numberOfLines",
      label: "Max lines",
      section: "Content",
      valueType: "number",
      target: "prop",
      path: "numberOfLines",
      helpText: "Truncates with an ellipsis beyond this many lines. Leave empty for no limit.",
    },
    {
      id: "fontSize",
      label: "Size",
      section: "Typography",
      valueType: "number",
      target: "style",
      path: "fontSize",
    },
    {
      id: "fontWeight",
      label: "Weight",
      section: "Typography",
      valueType: "enum",
      target: "style",
      path: "fontWeight",
      options: [
        { label: "Regular", value: "400" },
        { label: "Medium", value: "500" },
        { label: "Semibold", value: "600" },
        { label: "Bold", value: "700" },
      ],
    },
    {
      id: "color",
      label: "Color",
      section: "Typography",
      valueType: "color",
      target: "style",
      path: "color",
    },
    {
      id: "textAlign",
      label: "Alignment",
      section: "Typography",
      valueType: "enum",
      target: "style",
      path: "textAlign",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
        { label: "Justify", value: "justify" },
      ],
    },
  ],

  defaultProps: { content: "Text" },
  defaultStyle: { fontSize: 16, color: "#0b0d12" },

  generation: {
    runtimeComponent: "VNText",
    composesReactNative: ["Text"],
  },

  platformSupport: universalSupport(),
};
