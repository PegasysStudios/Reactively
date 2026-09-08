# Reactively Generated Runtime

## Purpose

Reactively generates a real Expo / React Native application from the canonical project document. The generated project must be maintainable, versioned, deterministic, and safe for GitHub export.

## Ownership Boundary

Generated code and user code must have separate ownership.

Recommended generated project:

```text
my-app/
├── app/                         # generated Expo Router routes
├── src/
│   ├── generated/              # Reactively-owned generated source
│   │   ├── screens/
│   │   ├── components/
│   │   ├── bindings/
│   │   ├── actions/
│   │   └── theme/
│   ├── custom/                 # user-owned source
│   │   ├── components/
│   │   ├── functions/
│   │   ├── hooks/
│   │   └── services/
│   ├── runtime/                # Reactively runtime wrappers
│   └── types/
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── reactively.json
```

Reactively may overwrite `generated/` and generated route files. It must not overwrite `custom/` without explicit user action.

## Versioned Template

Every project references:

```text
Reactively Runtime Version
Expo SDK Version
Template Version
```

Example:

```json
{
  "reactivelyRuntime": "1.0.0",
  "expoSdk": "57",
  "templateVersion": "1"
}
```

Generated apps should not depend on whatever happens to be the newest Expo SDK at generation time.

## Core Dependencies

Keep the default dependency set deliberately small.

Recommended baseline:

```text
expo
react
react-native
expo-router
react-native-safe-area-context
@tanstack/react-query
zustand
zod
```

Add other dependencies only when a user enables a capability that requires them.

## Generator Pipeline

```text
Reactively Project
       ↓
Schema Validation
       ↓
Normalization
       ↓
React Native IR
       ↓
Dependency Resolution
       ↓
Template Materialization
       ↓
Generate Routes
       ↓
Generate Screens
       ↓
Generate Bindings / Actions
       ↓
Copy Assets
       ↓
Generate Config
       ↓
Format
       ↓
Typecheck
```

## Intermediate Representation

Keep the generator isolated from editor-specific concerns.

```ts
interface ReactNativeIR {
  app: AppIR;
  routes: RouteIR[];
  screens: ScreenIR[];
  dependencies: DependencyIR[];
  assets: AssetIR[];
  runtimeCapabilities: RuntimeCapability[];
}
```

The IR makes future generator changes possible without changing the project schema whenever React Native implementation details change.

## Deterministic Output

Requirements:

- stable file names
- stable node ordering
- stable import ordering
- stable formatting
- no random IDs in generated source
- no timestamps inside generated files unless explicitly metadata-only

A one-property visual edit should produce a small Git diff.

## Runtime Wrappers

Use wrappers where Reactively needs stable semantics or platform adaptation.

Examples:

```tsx
<VNButton />
<VNImage />
<VNTextInput />
<VNDatePicker />
<VNMap />
```

Wrappers may:

- normalize platform differences
- expose consistent accessibility defaults
- normalize disabled/pressed states
- provide preview-friendly behavior
- keep generated screen code clean

## Routing

Use Expo Router as the initial routing foundation.

Reactively screen definitions should compile into deterministic route files and layouts.

Generated code should preserve route IDs separately from route names so renaming a screen does not break internal references.

## Native Configuration

Generate native configuration from explicit project capabilities.

Examples:

- camera permission
- photo library permission
- location
- deep links
- push notifications

Do not request permissions merely because a dependency exists.

## Platform-Specific Files

Prefer adapters:

```text
Feature.ios.tsx
Feature.android.tsx
Feature.web.tsx
```

Only create these when behavior actually differs.

## Generated Code Quality

Generated code should be readable enough that developers can understand exported projects.

Avoid deeply nested machine-only abstractions if normal React Native code can remain clean.

Run at minimum:

```text
prettier
TypeScript typecheck
project validation
```

before considering generation successful.
