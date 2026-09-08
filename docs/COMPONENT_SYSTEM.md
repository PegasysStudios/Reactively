# Reactively Component System

## Goal

Reactively's component system defines what users can place on the canvas, which React Native properties they may edit, what components may contain other components, how each component previews, and how each component generates into React Native code.

## Component Definition Contract

```ts
interface ComponentDefinition {
  type: string;
  label: string;
  category: string;
  description?: string;
  icon: string;

  capabilities: ComponentCapabilities;
  properties: PropertyDefinition[];

  defaultProps: Record<string, unknown>;
  defaultStyle: ReactNativeStyleModel;

  runtimeComponent: string;

  platformSupport: PlatformSupportDefinition;
}
```

The registry should be explicit and deterministic. Avoid runtime reflection or filename scanning for core built-in components.

## Capabilities

```ts
interface ComponentCapabilities {
  canHaveChildren: boolean;
  allowedParentTypes?: string[];
  allowedChildTypes?: string[];

  supportsAbsolutePosition: boolean;
  supportsFlexItem: boolean;
  supportsTextStyle: boolean;
  supportsEvents: string[];
}
```

Reactively may intentionally expose stricter rules than raw React Native.

Example: a Pressable can technically contain arbitrary children, but the built-in Reactively Button may remain a closed semantic component whose internal label/icon composition is controlled by Button properties.

## Initial Primitive Components

Recommended beta primitives:

```text
View
Text
Image
Button
Pressable
TextInput
ScrollView
SafeAreaView
FlatList
ActivityIndicator
Switch
```

Add complexity only after these are stable across iOS, Android, and web.

## Preset Components

Preset components should expand into primitive component trees rather than becoming opaque permanent node types where possible.

Examples:

```text
Search Bar
Profile Card
Stat Card
Login Form
Section Header
List Item
Bottom Action Bar
Empty State
```

Example:

```text
Profile Card
    ↓
View
├── Image
├── View
│   ├── Text
│   └── Text
└── Button
```

After insertion, users can inspect and modify the expanded tree.

## Property Definition Contract

```ts
interface PropertyDefinition {
  id: string;
  label: string;
  section: string;
  valueType: "string" | "number" | "boolean" | "color" | "enum" | "layoutValue" | "asset";

  target: "prop" | "style" | "metadata";
  path: string;

  options?: Array<{ label: string; value: unknown }>;
  visibleWhen?: PropertyCondition;
  enabledWhen?: PropertyCondition;
  validation?: PropertyValidation;
  helpText?: string;
}
```

The inspector should render from these definitions rather than implementing a bespoke inspector for every component.

## Common Inspector Sections

Recommended ordering:

```text
Hierarchy
Layout
Size & Position
Spacing
Appearance
Typography
Content
State
Accessibility
Events
```

## Parent / Child Rules

Parent choices must be generated from the registry and current project tree.

Never allow:

- self-parenting
- cycles
- invalid semantic nesting
- parenting across unrelated screens

Default parent for a new node should be the active screen root unless the insertion operation explicitly targets a valid container.

## Custom Components

Reactively should eventually support two forms of custom components.

### Visual Custom Components

A reusable tree built from supported Reactively nodes.

```text
Custom Component: ProductCard
View
├── Image
├── Text
├── Text
└── Button
```

Store:

- component tree template
- exposed properties
- named slots if supported later
- default styles
- version metadata

### Code Custom Components

Advanced feature: user supplies a React Native component implementation that conforms to a Reactively manifest.

Require an explicit contract:

```ts
interface CustomComponentManifest {
  name: string;
  exportName: string;
  supportedPlatforms: Platform[];
  properties: PropertyDefinition[];
  events: EventDefinition[];
  canHaveChildren: boolean;
}
```

Do not attempt to infer arbitrary source code into editor properties automatically for beta.

## Runtime Components

Generated apps should preferably target Reactively runtime wrappers for complex semantics.

Examples:

```text
VNButton
VNImage
VNTextInput
VNList
VNDatePicker
```

Wrappers can normalize cross-platform behavior while primitives such as View/Text may map directly where safe.

## Component Versioning

Built-in component definitions may evolve independently from project schema.

Track definition/runtime versions so old projects can still regenerate predictably.

Do not silently change the meaning of an existing component property in a way that changes old app output.
