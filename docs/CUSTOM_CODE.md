# Reactively Custom Code

## Goal

Reactively should support real developer escape hatches without making arbitrary source code the canonical representation of the application.

## Ownership Rule

Reactively owns generated code.

Users own custom code.

```text
src/generated/   # Reactively-owned
src/custom/      # user-owned
```

Reactively must not overwrite user-owned files during regeneration.

## Custom Functions

First custom-code feature should be TypeScript functions.

Examples:

```text
formatCurrency
validateEmail
calculateCartTotal
transformApiResponse
```

Store a function definition in the project model and materialize it into `src/custom/functions`.

Functions can be referenced by actions and bindings through stable IDs.

## Custom Hooks / Services

Later allow user-authored modules such as:

```text
src/custom/hooks/
src/custom/services/
```

Reactively can expose imports to these modules through explicit manifests.

## Code Components

Advanced feature: user may create a custom React Native component.

Require a manifest describing:

```text
component name
export name
properties
events
platform support
whether children are accepted
preview fallback
```

Do not attempt to infer arbitrary code structure automatically for beta.

## Read-Only Generated Code View

The Code tab should primarily present generated source as read-only.

Recommended UX:

```text
Project Files
Generated
Custom
```

Generated files:

```text
Read Only
Managed by Reactively
```

Custom files may later be editable.

## Security

Custom code runs with the privileges of the generated app, not with unrestricted Electron desktop privileges.

Do not evaluate arbitrary custom project code in the Electron renderer process.

Preview execution should be isolated to the preview runtime/process.

## Unsupported Round Trip

Reactively should not promise:

```text
arbitrary React Native source -> perfect visual editor reconstruction
```

Externally editing generated files may be allowed for exported projects, but those edits are not canonical and may be overwritten by future generation.
