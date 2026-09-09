import { universalSupport } from "@reactively/platform";

import type { ComponentDefinition } from "../contracts.js";

/**
 * View is Reactively's layout container and the only component that accepts arbitrary
 * children in the MVP. It maps directly to React Native's `View`.
 */
export const viewDefinition: ComponentDefinition = {
  type: "View",
  label: "View",
  category: "Layout",
  description: "A flexbox container for grouping and arranging other components.",
  icon: "Square",

  capabilities: {
    canHaveChildren: true,
    allowedChildTypes: ["View", "Text", "Button"],
    supportsAbsolutePosition: true,
    supportsContainerLayout: true,
    supportsFlexItem: true,
    supportsTextStyle: false,
    supportsEvents: [],
    canBeScreenRoot: true,
  },

  properties: [
    {
      id: "flexDirection",
      label: "Flex Direction",
      section: "Flexbox",
      valueType: "enum",
      target: "style",
      path: "flexDirection",
      options: [
        { label: "Column", value: "column" },
        { label: "Row", value: "row" },
        { label: "Column Reverse", value: "column-reverse" },
        { label: "Row Reverse", value: "row-reverse" },
      ],
    },
    {
      id: "justifyContent",
      label: "Justify Content",
      section: "Flexbox",
      valueType: "enum",
      target: "style",
      path: "justifyContent",
      options: [
        { label: "Flex Start", value: "flex-start" },
        { label: "Flex End", value: "flex-end" },
        { label: "Center", value: "center" },
        { label: "Space Between", value: "space-between" },
        { label: "Space Around", value: "space-around" },
        { label: "Space Evenly", value: "space-evenly" },
      ],
      helpText: "Distributes children along the main axis.",
    },
    {
      id: "alignItems",
      label: "Align Items",
      section: "Flexbox",
      valueType: "enum",
      target: "style",
      path: "alignItems",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Flex Start", value: "flex-start" },
        { label: "Flex End", value: "flex-end" },
        { label: "Center", value: "center" },
        { label: "Baseline", value: "baseline" },
      ],
      helpText: "Aligns children along the cross axis.",
    },
    {
      id: "gap",
      label: "Gap",
      section: "Flexbox",
      valueType: "number",
      target: "style",
      path: "gap",
    },
    {
      id: "padding",
      label: "Padding",
      section: "Spacing",
      valueType: "number",
      target: "style",
      path: "padding.all",
    },
    {
      id: "backgroundColor",
      label: "Background",
      section: "Appearance",
      valueType: "color",
      target: "style",
      path: "backgroundColor",
    },
    {
      id: "borderRadius",
      label: "Corner radius",
      section: "Appearance",
      valueType: "number",
      target: "style",
      path: "borderRadius",
    },
  ],

  defaultProps: {},
  defaultStyle: {},

  generation: {
    runtimeComponent: "VNView",
    composesReactNative: ["View"],
  },

  platformSupport: universalSupport(),
};
