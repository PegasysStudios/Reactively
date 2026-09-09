import type { PlatformSupport } from "@reactively/platform";

import type { ComponentDefinition } from "../contracts.js";

/**
 * Button is a closed semantic component.
 *
 * It generates as `Pressable` wrapping a `Text` label rather than React Native's built-in
 * `Button`, which cannot be styled meaningfully and renders differently on every
 * platform. Because the label and press states are owned by the wrapper, the button does
 * not accept arbitrary Reactively children in the MVP — users who need a custom pressable
 * layout will reach for Pressable + View once those primitives land.
 */

/**
 * Pressed and hover feedback differ by platform: iOS and Android use native ripple/
 * opacity semantics, web adds hover and focus-visible states that have no native
 * equivalent. The behaviour is equivalent, the implementation is not, so web is
 * `adapted` rather than `full`.
 */
const buttonPlatformSupport: PlatformSupport = {
  ios: "full",
  android: "full",
  web: "adapted",
  notes: {
    web: "Hover and keyboard focus states are web-only and are added by the runtime wrapper.",
  },
};

export const buttonDefinition: ComponentDefinition = {
  type: "Button",
  label: "Button",
  category: "Input",
  description: "A pressable control with a text label.",
  icon: "MousePointerClick",

  capabilities: {
    canHaveChildren: false,
    allowedChildTypes: [],
    supportsAbsolutePosition: true,
    supportsContainerLayout: false,
    supportsFlexItem: true,
    supportsTextStyle: true,
    supportsEvents: ["onPress", "onLongPress"],
    canBeScreenRoot: false,
  },

  properties: [
    {
      id: "label",
      label: "Title",
      section: "Button Properties",
      valueType: "string",
      target: "prop",
      path: "label",
    },
    {
      id: "variant",
      label: "Variant",
      section: "Appearance",
      valueType: "enum",
      target: "prop",
      path: "variant",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Ghost", value: "ghost" },
      ],
    },
    {
      id: "disabled",
      label: "Disabled",
      section: "State",
      valueType: "boolean",
      target: "prop",
      path: "disabled",
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
    {
      id: "color",
      label: "Label color",
      section: "Typography",
      valueType: "color",
      target: "style",
      path: "color",
    },
  ],

  defaultProps: { label: "Button", variant: "primary", disabled: false },
  defaultStyle: {
    backgroundColor: "#3b5bfd",
    color: "#ffffff",
    borderRadius: 10,
    padding: { horizontal: 20, vertical: 12 },
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: "600",
  },

  generation: {
    runtimeComponent: "VNButton",
    composesReactNative: ["Pressable", "Text"],
  },

  platformSupport: buttonPlatformSupport,
};
