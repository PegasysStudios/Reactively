import type { PlatformSupport } from "@reactively/platform";
import type { ComponentStyle } from "@reactively/project-schema";

/**
 * Component contracts.
 *
 * These are authored in-repo rather than parsed from untrusted input, so they are plain
 * readonly interfaces. When user-supplied custom component manifests arrive they will get
 * a Zod schema at that boundary; the built-in registry does not need one.
 *
 * The registry is explicit and deterministic on purpose: no filename scanning, no runtime
 * reflection. See docs/COMPONENT_SYSTEM.md.
 */

/** Where an edited value lands on the node. */
export type PropertyTarget = "prop" | "style" | "metadata";

export type PropertyValueType =
  "string" | "number" | "boolean" | "color" | "enum" | "layoutValue" | "asset";

export interface ComponentPropertyOption {
  readonly label: string;
  readonly value: string | number | boolean;
}

/**
 * Describes one editable property.
 *
 * The inspector renders from these definitions instead of hand-writing a panel per
 * component, which is what keeps adding a component cheap.
 */
export interface ComponentPropertyDefinition {
  readonly id: string;
  readonly label: string;
  /** Inspector section, e.g. "Content", "Layout", "Typography". */
  readonly section: string;
  readonly valueType: PropertyValueType;
  readonly target: PropertyTarget;
  /** Dot path within `props` or `style`, e.g. `content` or `padding.all`. */
  readonly path: string;
  readonly options?: readonly ComponentPropertyOption[];
  readonly helpText?: string;
}

/**
 * What a component is allowed to do inside the editor.
 *
 * Reactively may expose stricter rules than raw React Native. A Pressable can technically
 * wrap anything, but the built-in Button stays a closed semantic component so its label,
 * states and accessibility remain controllable from properties.
 */
export interface ComponentCapabilities {
  readonly canHaveChildren: boolean;
  /** When present, only these parent types may contain the component. */
  readonly allowedParentTypes?: readonly string[];
  /** When present, only these child types may be placed inside the component. */
  readonly allowedChildTypes?: readonly string[];
  readonly supportsAbsolutePosition: boolean;
  readonly supportsFlexItem: boolean;
  readonly supportsTextStyle: boolean;
  /** Events the component can raise, e.g. `onPress`. */
  readonly supportsEvents: readonly string[];
  /** The component may be the root node of a screen. */
  readonly canBeScreenRoot: boolean;
}

/** How a component becomes React Native source. */
export interface ComponentGeneration {
  /** Reactively runtime wrapper emitted into the generated app. */
  readonly runtimeComponent: string;
  /**
   * React Native primitives the wrapper is built from.
   *
   * Recorded so the generator's dependency resolution and the platform matrix can reason
   * about what actually ships, and so reviewers can see that Button is Pressable + Text
   * rather than React Native's barely-customizable `Button`.
   */
  readonly composesReactNative: readonly string[];
}

export interface ComponentDefinition {
  readonly type: string;
  readonly label: string;
  readonly category: string;
  readonly description: string;
  /** Lucide icon name used by the editor's component library. */
  readonly icon: string;

  readonly capabilities: ComponentCapabilities;
  readonly properties: readonly ComponentPropertyDefinition[];

  readonly defaultProps: Readonly<Record<string, unknown>>;
  readonly defaultStyle: ComponentStyle;

  readonly generation: ComponentGeneration;
  readonly platformSupport: PlatformSupport;
}
