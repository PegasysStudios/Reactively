/**
 * Reactively runtime.
 *
 * Generated screens render these wrappers instead of raw React Native primitives. The
 * indirection is what lets Reactively normalize cross-platform behaviour, guarantee
 * accessibility defaults and keep generated screen code free of platform conditionals.
 *
 * These implementations mirror the contracts in @reactively/generated-runtime. When
 * behaviour genuinely differs per platform, add `VNSomething.ios.tsx` /
 * `VNSomething.android.tsx` / `VNSomething.web.tsx` next to the shared file rather than
 * branching on `Platform.OS` inside it.
 */
export { VNButton, type VNButtonProps } from "./VNButton";
export { VNText, type VNTextProps } from "./VNText";
export { VNView, type VNViewProps } from "./VNView";
