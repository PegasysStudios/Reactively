# Reactively Project Schema

## Purpose

The Reactively project document is the canonical representation of a user-built application. The editor, preview system, generator, cloud sync layer, and publishing system all consume this same document.

Generated React Native source is not the source of truth.

## Top-Level Model

```ts
export interface ReactivelyProject {
  schemaVersion: number;
  projectId: string;
  runtimeVersion: string;
  expoSdkVersion: string;

  name: string;
  createdAt: string;
  updatedAt: string;

  app: AppConfiguration;
  theme: ThemeDefinition;

  screens: Record<string, ScreenDefinition>;
  nodes: Record<string, ComponentNode>;
  customComponents: Record<string, CustomComponentDefinition>;

  actions: Record<string, ActionDefinition>;
  dataSources: Record<string, DataSourceDefinition>;
  queries: Record<string, QueryDefinition>;
  mutations: Record<string, MutationDefinition>;
  bindings: Record<string, BindingDefinition>;
  functions: Record<string, CustomFunctionDefinition>;

  assets: Record<string, AssetReference>;
  platformSettings: PlatformSettings;
}
```

Use ID-keyed records for fast lookup and stable references. Ordering belongs in explicit arrays such as `children` and route order.

## App Configuration

```ts
interface AppConfiguration {
  displayName: string;
  slug: string;
  version: string;

  iosBundleIdentifier?: string;
  androidPackageName?: string;
  webBasePath?: string;

  iconAssetId?: string;
  splashAssetId?: string;

  initialScreenId: string;
}
```

## Screens / Routes

```ts
interface ScreenDefinition {
  id: string;
  name: string;
  route: string;
  rootNodeId: string;

  options: {
    safeArea: boolean;
    scrollBehavior: "none" | "vertical" | "horizontal";
    presentation?: "default" | "modal";
  };
}
```

Routes are user-facing application navigation paths, not filesystem paths.

Examples:

```text
/
/home
/settings
/profile/[userId]
```

## Component Nodes

```ts
interface ComponentNode {
  id: string;
  type: string;
  name: string;

  parentId: string | null;
  children: string[];

  props: Record<string, unknown>;
  style: ReactNativeStyleModel;

  events: EventBinding[];
  visibility?: ConditionalExpression;

  metadata?: {
    createdFromPresetId?: string;
    customComponentId?: string;
  };
}
```

Hierarchy must obey these invariants:

- a node cannot parent itself
- a node cannot parent one of its ancestors
- every non-root node has exactly one parent
- child arrays and `parentId` must agree
- node types must pass component capability rules

## React Native Style Model

Use an explicit typed subset rather than arbitrary CSS strings.

```ts
interface ReactNativeStyleModel {
  position?: "relative" | "absolute" | "static";

  top?: LayoutValue;
  right?: LayoutValue;
  bottom?: LayoutValue;
  left?: LayoutValue;

  width?: LayoutValue;
  height?: LayoutValue;
  minWidth?: LayoutValue;
  maxWidth?: LayoutValue;
  minHeight?: LayoutValue;
  maxHeight?: LayoutValue;

  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";
  justifyContent?:
    "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
  alignItems?: "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
  alignSelf?: "auto" | "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";

  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: LayoutValue;

  gap?: number;
  rowGap?: number;
  columnGap?: number;

  margin?: EdgeValues;
  padding?: EdgeValues;

  overflow?: "visible" | "hidden" | "scroll";

  backgroundColor?: string;
  opacity?: number;

  borderWidth?: number;
  borderColor?: string;
  borderStyle?: "solid" | "dotted" | "dashed";
  borderRadius?: number;

  transform?: TransformDefinition[];

  // Text-capable nodes may use text style fields.
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  textAlign?: "auto" | "left" | "right" | "center" | "justify";
  letterSpacing?: number;
  lineHeight?: number;
}
```

## Layout Values

Do not parse arbitrary CSS units.

```ts
type LayoutValue =
  { type: "points"; value: number } | { type: "percent"; value: number } | { type: "auto" };
```

This should be converted into React Native-compatible style values during generation.

## Edge Values

```ts
interface EdgeValues {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  horizontal?: number;
  vertical?: number;
  all?: number;
}
```

The schema should normalize conflicting shorthand/expanded values before generation.

## Events

```ts
interface EventBinding {
  event: string;
  actionIds: string[];
}
```

Examples:

```text
onPress
onLongPress
onChangeText
onSubmitEditing
onFocus
onBlur
onValueChange
```

Available events depend on the component definition.

## Actions

```ts
interface ActionDefinition {
  id: string;
  type:
    | "navigate"
    | "goBack"
    | "openUrl"
    | "setVariable"
    | "runQuery"
    | "runMutation"
    | "runFunction"
    | "showAlert"
    | "setVisibility";

  config: Record<string, unknown>;
}
```

Actions should reference stable IDs rather than user-visible names.

## Data Bindings

Avoid making strings such as `{{user.name}}` the source of truth.

```ts
interface BindingDefinition {
  id: string;
  targetNodeId: string;
  targetProperty: string;

  source:
    | { type: "query"; queryId: string; path: string[] }
    | { type: "variable"; variableId: string; path?: string[] }
    | { type: "routeParam"; name: string }
    | { type: "function"; functionId: string };
}
```

The UI may display readable expressions while IDs remain canonical.

## Assets

```ts
interface AssetReference {
  id: string;
  type: "image" | "font" | "video" | "file";
  fileName: string;
  mimeType: string;
  byteSize: number;
  contentHash: string;
  localRelativePath?: string;
  remoteObjectKey?: string;
}
```

Never embed large binary assets as base64 inside the project document.

## Custom Functions

```ts
interface CustomFunctionDefinition {
  id: string;
  name: string;
  language: "typescript";
  source: string;
  parameters: FunctionParameter[];
  returnType?: string;
}
```

## Versioning

Every document includes `schemaVersion`.

Rules:

- all schema changes require deliberate migration handling
- migrations run sequentially
- migrations must be deterministic
- old documents should never be mutated before a backup/recovery copy exists
- unknown future schema versions should fail safely as read-only rather than being overwritten

## Local Project Structure

```text
MyApp.reactively/
├── project.json
├── assets/
├── custom/
└── .reactively/
    ├── autosave/
    ├── cache/
    ├── preview/
    ├── generated/
    └── logs/
```

`project.json` is the authoritative local document.
