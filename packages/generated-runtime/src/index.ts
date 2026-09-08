/**
 * The Reactively runtime used by generated React Native applications.
 *
 * Generated screens render `VNView` / `VNText` / `VNButton` rather than raw React Native
 * primitives. The indirection buys three things: cross-platform behaviour can be
 * normalized in one place, accessibility defaults are guaranteed, and the generator emits
 * clean, readable screen code instead of repeating platform conditionals.
 *
 * This package intentionally contains contracts only — no React, no react-native import.
 * Two reasons:
 *
 * 1. Pulling React Native into the editor monorepo's dependency graph would slow every
 *    install and every CI run for code the editor never executes.
 * 2. The implementations must be validated against a real Expo build before they are
 *    worth shipping; contracts first, components once templates/expo-app builds on
 *    device.
 *
 * The concrete components live in `src/runtime/` inside the generated app, materialized
 * from templates/expo-app. See docs/GENERATED_RUNTIME.md.
 */

/**
 * Runtime version marker.
 *
 * Every generated app records the runtime version it was built against so an old project
 * can be regenerated predictably instead of silently picking up new behaviour. Must stay
 * in sync with `CURRENT_RUNTIME_VERSION` in @reactively/project-schema and with
 * `reactivelyRuntimeVersion` in templates/expo-app/reactively.json.
 */
export const REACTIVELY_RUNTIME_VERSION = "0.1.0";

/** Runtime wrappers the generator may emit. */
export type RuntimeComponentName = "VNView" | "VNText" | "VNButton";

/**
 * Styles are passed through as the React Native style objects the generator produced.
 * Typed loosely here because the concrete `StyleProp<ViewStyle>` type only exists once
 * react-native is present in the generated app.
 */
export type RuntimeStyle = Readonly<Record<string, unknown>>;

/** Shared by every runtime component. */
export interface RuntimeComponentBaseProps {
  readonly style?: RuntimeStyle;
  /** Reactively node ID, emitted for preview highlighting and error attribution. */
  readonly testID?: string;
  readonly accessibilityLabel?: string;
}

export interface VNViewProps extends RuntimeComponentBaseProps {
  readonly children?: unknown;
}

export interface VNTextProps extends RuntimeComponentBaseProps {
  readonly content: string;
  readonly numberOfLines?: number;
}

export type VNButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Button is Pressable + Text, never React Native's `Button`.
 *
 * The built-in component cannot be styled and renders differently on each platform,
 * which would make the editor's preview a lie.
 */
export interface VNButtonProps extends RuntimeComponentBaseProps {
  readonly label: string;
  readonly variant?: VNButtonVariant;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
  readonly onLongPress?: () => void;
}

/** Props keyed by runtime component, so the generator can type its emitted trees. */
export interface RuntimeComponentProps {
  readonly VNView: VNViewProps;
  readonly VNText: VNTextProps;
  readonly VNButton: VNButtonProps;
}
