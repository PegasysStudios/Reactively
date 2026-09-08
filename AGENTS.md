# Reactively — Agent Context & Engineering Rules

> **Purpose:** This file is the shared engineering context for coding agents working on Reactively.  
> Put it at the repository root as `AGENTS.md`, and include or reference it when starting a new agent/chat session.  
> Agents should treat these rules as architectural constraints unless the current task explicitly changes them.

---

# 1. Product Summary

**Reactively** is a visual React Native application builder.

Core product idea:

> **React Native, visually.**

Reactively should let users build real React Native applications without writing most of the code themselves, while exposing genuine React Native concepts such as:

- `View`
- `Text`
- `Pressable`
- `TextInput`
- `Image`
- `ScrollView`
- safe areas
- parent/child nesting
- Flexbox
- `flexDirection`
- `justifyContent`
- `alignItems`
- `alignSelf`
- `flexGrow`
- `flexShrink`
- `position`
- margin
- padding
- gap
- routes
- events/actions
- data bindings
- custom functions
- platform-specific behavior

Reactively should not generate code by visually guessing what a design probably means.

The editor must manipulate a **structured Reactively project document** that maps deterministically to React Native concepts.

---

# 2. Current MVP Goal

Do not overbuild beyond the current milestone unless explicitly requested.

The first meaningful MVP is complete when Reactively can:

1. Create/open a project.
2. Edit one screen.
3. Add:
   - View
   - Text
   - Button
4. Establish parent/child relationships.
5. Configure basic React Native layout/style properties.
6. Preview the app in-browser using React Native Web-compatible behavior.
7. Save/reload the project.
8. Generate a valid Expo + React Native + TypeScript project.
9. Use Expo Router.
10. Build for iOS and Android.
11. Produce builds suitable for TestFlight/App Store and Google Play testing/publishing.

The following are not required for the first editor MVP unless explicitly requested:

- GitHub integration
- AI generation
- real-time collaboration
- billing
- advanced data-flow graphs
- marketplace functionality
- Electron
- arbitrary custom-code round-tripping

---

# 3. Foundational Architecture

Reactively is **not just a Next.js application**.

Think of the architecture as:

```text
                         Reactively Core
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
           Next.js Web     Electron App    Cloud Workers
             first            later           later
```

Reusable product logic belongs in framework-independent packages.

The web application is the first host.

A future Electron desktop application should be able to reuse the same editor/core packages.

---

# 4. Repository Shape

Target structure:

```text
reactively/
│
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (marketing)/
│       │   ├── (dashboard)/
│       │   ├── editor/
│       │   └── preview/
│       │
│       ├── components/
│       │   ├── marketing/
│       │   ├── dashboard/
│       │   ├── editor/
│       │   └── ui/
│       │
│       ├── lib/
│       ├── providers/
│       └── tests/
│
├── packages/
│   ├── project-schema/
│   ├── component-registry/
│   ├── editor-engine/
│   ├── layout-engine/
│   ├── history/
│   ├── validation/
│   ├── generator/
│   ├── preview-runtime/
│   ├── generated-runtime/
│   ├── platform/
│   └── shared/
│
├── templates/
│   └── expo-app/
│
├── docs/
├── tooling/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

Use workspace package names under:

```text
@reactively/*
```

Examples:

```text
@reactively/project-schema
@reactively/component-registry
@reactively/editor-engine
@reactively/layout-engine
@reactively/history
@reactively/validation
@reactively/generator
@reactively/preview-runtime
@reactively/generated-runtime
@reactively/platform
@reactively/shared
```

---

# 5. Package Dependency Direction

Dependencies should flow inward toward core data/contracts.

Preferred direction:

```text
                    apps/web
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   editor-engine    generator   preview-runtime
          │            │            │
          └──────┬─────┴─────┬──────┘
                 ▼           ▼
        component-registry  validation
                 │           │
                 └─────┬─────┘
                       ▼
                 project-schema
```

Rules:

- `apps/*` may depend on packages.
- Packages must never depend on `apps/*`.
- Core packages must not depend on Next.js.
- Avoid circular dependencies.
- Keep package APIs explicit through package-root exports.
- Avoid deep imports into another package's internal `src/` paths.

---

# 6. Canonical Source of Truth

The **Reactively project document** is the canonical source of truth.

Generated React Native code is output.

Never architect the editor around reverse-engineering generated JSX.

Correct:

```text
Reactively Project
      │
      ├── Visual Editor
      ├── Preview
      └── Generator
              ↓
         React Native
```

Incorrect:

```text
Visual Editor ↔ arbitrary React Native source
```

Generated code should be deterministic.

The same valid Reactively project should produce stable generated output wherever possible.

---

# 7. Project State vs Editor State

Keep persistent product state separate from ephemeral editor UI state.

## Project state — persistent

Examples:

- project metadata
- screens
- routes
- component nodes
- parent/child relationships
- props
- styles
- actions
- variables
- data bindings
- assets
- custom functions

This belongs in the Reactively project document.

## Editor state — ephemeral

Examples:

- selected node
- hovered node
- zoom
- pan
- active tool
- open panel
- expanded layers
- drag state
- resize state
- snapping guides
- temporary selection rectangle

Do **not** serialize editor state into the project document.

---

# 8. State Management Rules

Use **Zustand** for client/editor state.

Prefer multiple focused stores over one giant application store.

Typical stores may include:

```text
useProjectStore
useEditorStore
useHistoryStore
usePreviewStore
useSyncStore
```

Do not create a store merely because a component needs one local boolean.

Use ordinary React state for genuinely local UI concerns.

Persistent project mutations should not be scattered as arbitrary Zustand setters throughout visual components.

Prefer a command/domain-operation boundary such as:

```ts
projectCommands.addComponent(...)
projectCommands.deleteComponent(...)
projectCommands.reparentComponent(...)
projectCommands.updateProps(...)
projectCommands.updateStyle(...)
projectCommands.addScreen(...)
```

Desired flow:

```text
UI
 ↓
Command / Domain Operation
 ↓
Project Store
 ├── UI update
 ├── history
 ├── dirty state
 ├── local persistence
 └── future cloud sync
```

---

# 9. TanStack Query Rules

Use **TanStack Query** for server/cache state.

Examples:

- user/account data
- project lists
- remote revision metadata
- permissions
- cloud assets
- build status
- deployment status

Do **not** use TanStack Query as the editor's live project-document store.

The editor must remain responsive without a network round trip.

---

# 10. Zod Rules

Use **Zod** at untrusted boundaries.

The `project-schema` package should define and validate persistent document structures.

Use Zod for:

- loading project documents
- import/export
- persisted settings
- environment/config validation
- cloud responses where runtime validation is useful
- schema migration boundaries

Prefer:

```ts
const parsed = ProjectSchema.parse(data);
```

over unsafe casting:

```ts
const project = data as ReactivelyProject;
```

Avoid maintaining an unrelated manual TypeScript interface and separate Zod schema when the type can be inferred from the schema.

---

# 11. Dexie / IndexedDB Rules

The web editor should be **local-first**.

Use **Dexie** as the IndexedDB abstraction.

Expected eventual write path:

```text
User mutation
    ↓
memory immediately
    ↓
IndexedDB persistence
    ↓
debounced cloud sync
```

The user should not lose work because:

- the network drops
- Supabase is unavailable
- the tab refreshes
- the browser crashes

Keep persistence behind an abstraction rather than calling Dexie from random UI components.

Conceptual boundary:

```ts
interface ProjectPersistence {
  loadLocal(projectId: string): Promise<ReactivelyProject | null>;
  saveLocal(project: ReactivelyProject): Promise<void>;
  deleteLocal(projectId: string): Promise<void>;
}
```

A future Electron implementation may use filesystem/SQLite while keeping the higher-level API stable.

---

# 12. Supabase Rules

Supabase is the planned initial backend.

It may eventually provide:

- authentication
- project metadata
- project revisions
- permissions
- assets
- cloud backup/sync
- build records

Do not couple core packages to Supabase.

Supabase-specific code belongs in the host/backend integration layer.

Never make these packages import Supabase:

```text
project-schema
layout-engine
component-registry
editor-engine
generator
```

Do not expose privileged keys to the browser.

---

# 13. Component System Rules

Components are centrally registered.

Do not scatter component behavior across giant `switch` statements.

A component definition should be able to describe concepts such as:

```ts
interface ComponentDefinition {
  type: string;
  label: string;
  category: string;
  capabilities: ComponentCapabilities;
  properties: ComponentPropertyDefinition[];
  defaultProps: Record<string, unknown>;
  defaultStyle: ComponentStyle;
  platformSupport: PlatformSupport;
}
```

Initial primitives:

- View
- Text
- Button

Future component library entries should reuse this architecture.

## Parenting

The registry defines whether components can contain children.

Example MVP semantics:

```text
Screen → may contain components
View   → may contain components
Text   → no arbitrary Reactively children
Button → no arbitrary Reactively children
```

Even if React Native technically permits certain nested structures, Reactively may intentionally expose a safer semantic subset.

Do not infer parent/child relationships from visual overlap.

Hierarchy must be explicit in the project model.

---

# 14. Presets vs Primitives

Do not create permanent new runtime primitive types for every polished component preset.

Example:

```text
Profile Card
```

should usually expand into primitives:

```text
View
├── Image
├── View
│   ├── Text
│   └── Text
└── Button/Pressable
```

Presets are templates composed from supported primitives.

This keeps generated output understandable and maintainable.

---

# 15. React Native Semantics First

Reactively should intentionally expose real React Native concepts.

Do not invent web-only layout semantics and then attempt to translate them later.

Examples of valid concepts:

- `flexDirection`
- `justifyContent`
- `alignItems`
- `alignSelf`
- `flexGrow`
- `flexShrink`
- `flexBasis`
- `position`
- `top`
- `right`
- `bottom`
- `left`
- `gap`
- padding
- margin
- width
- height
- overflow

Do not expose CSS-only values such as `position: fixed` unless Reactively explicitly implements a cross-platform abstraction for them.

---

# 16. Layout Engine Rules

Layout behavior belongs in `@reactively/layout-engine`, not in random editor React components.

Visual components should not independently calculate layout rules.

Preferred conceptual pipeline:

```text
Reactively Project
       ↓
Layout Engine
       ↓
Computed Layout Tree
       ↓
Editor Renderer
```

A computed node may contain:

```ts
interface ComputedLayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
```

Do not reimplement an entire Yoga/Flexbox engine unless required.

Support the smallest React Native-compatible subset needed by current product features.

---

# 17. Canvas / Editor Engine Rules

Canvas behavior should be extracted into domain-specific logic.

Avoid components containing hundreds of lines that combine:

- pointer tracking
- snapping
- coordinate conversion
- selection
- mutation
- rendering
- persistence

Separate concepts such as:

```text
coordinate transforms
selection engine
snap engine
drag session
resize session
reparenting
viewport
guides
```

Example:

```ts
snapEngine.calculate(...)
```

rather than embedding snapping rules inside `Canvas.tsx`.

React components should primarily:

1. read state
2. render UI
3. dispatch semantic events/commands

---

# 18. React Component Quality Rules

Prefer small, readable visual components.

Avoid "god components."

A React component should not simultaneously own:

- server requests
- project-domain mutation logic
- persistence
- validation
- layout algorithms
- business rules
- visual rendering

Extract logic into:

- hooks when logic is React-specific
- services when it is infrastructure-related
- package-level pure functions for domain logic
- command functions for persistent mutations
- utilities only when genuinely generic

Example:

Bad:

```text
EditorCanvas.tsx
1500 lines
```

containing everything.

Preferred:

```text
EditorCanvas.tsx
useCanvasInteractions.ts
useCanvasSelection.ts
drag-session.ts
snap-engine.ts
coordinate-space.ts
canvas-node.tsx
selection-overlay.tsx
```

Do not over-fragment trivial logic into dozens of single-line files either.

Use judgment.

---

# 19. Single Responsibility Principle

Every module should have one clear reason to change.

Examples:

- schema files define data
- validators validate
- stores hold state
- commands mutate project state
- React components render UI
- services talk to external systems
- generators generate
- persistence adapters persist
- layout engine calculates layout

Do not make a single module handle unrelated responsibilities for convenience.

---

# 20. Clean Code Expectations

All agent-generated code must prioritize human readability.

Requirements:

- meaningful names
- small focused functions
- no cryptic abbreviations
- no unnecessary cleverness
- no giant nested conditionals
- no unnecessary abstractions
- no premature generic frameworks
- no copy/pasted domain logic when a shared concept clearly exists
- no dead code
- no commented-out abandoned implementations
- no unexplained TODOs that materially affect behavior

Prefer early returns over deeply nested control flow.

Prefer explicit domain terms.

Example:

```ts
reparentComponent(...)
```

is better than:

```ts
updateThing(...)
```

---

# 21. DRY Without Over-Abstraction

Avoid duplicated business/domain logic.

But do not abstract merely because two lines happen to look similar.

Good reasons to extract:

- same business rule
- same validation
- same coordinate logic
- same persistence behavior
- same component property metadata
- same generation semantics

Bad reason:

- two components each contain three similar JSX lines

Abstractions should represent stable concepts.

---

# 22. File Placement Rules

Before creating a file, determine which layer owns the responsibility.

## `apps/web/app/`

Next.js route entry points, layouts, server boundaries.

Keep route files thin.

## `apps/web/components/marketing/`

Marketing-only UI.

Must not import editor internals.

## `apps/web/components/dashboard/`

Project dashboard/account-facing components.

## `apps/web/components/editor/`

React UI specific to the visual editor.

Suggested subfolders:

```text
canvas/
layers/
inspector/
toolbar/
screens/
component-library/
preview/
```

## `apps/web/components/ui/`

Reusable product UI primitives built around Radix UI.

Examples:

```text
button.tsx
select.tsx
dialog.tsx
tabs.tsx
tooltip.tsx
popover.tsx
separator.tsx
```

Do not place editor business logic here.

## `apps/web/lib/`

Web-host-specific infrastructure/helpers.

Examples:

```text
supabase/
persistence/
browser/
config/
```

Do not use this as a generic dumping ground.

## `apps/web/providers/`

React providers such as:

- TanStack Query provider
- theme provider
- app-level provider composition

## `packages/project-schema/`

Persistent project contracts and Zod schemas.

## `packages/component-registry/`

Component definitions, property definitions, capabilities, defaults.

## `packages/editor-engine/`

Framework-independent editor behavior and project operations.

## `packages/layout-engine/`

React Native-oriented layout computation/contracts.

## `packages/history/`

Undo/redo and command-history infrastructure.

## `packages/validation/`

Cross-project/domain validation.

## `packages/generator/`

Project → IR → generated Expo/React Native files.

## `packages/preview-runtime/`

Preview-specific runtime integration.

## `packages/generated-runtime/`

Runtime components/helpers included in generated applications.

## `packages/platform/`

Cross-platform capability definitions and platform abstractions.

## `packages/shared/`

Only genuinely cross-domain generic utilities.

Do not make `shared` a junk drawer.

---

# 23. Feature Folder Organization

Use feature/domain organization where it improves discoverability.

Example:

```text
apps/web/components/editor/
├── canvas/
│   ├── editor-canvas.tsx
│   ├── canvas-node.tsx
│   ├── selection-overlay.tsx
│   └── hooks/
│
├── inspector/
│   ├── inspector.tsx
│   ├── sections/
│   └── controls/
│
├── layers/
│   ├── layers-panel.tsx
│   └── layer-node.tsx
│
└── toolbar/
    └── editor-toolbar.tsx
```

Do not create a flat directory containing hundreds of unrelated files.

---

# 24. Naming Rules

Use descriptive file names.

Prefer:

```text
component-registry.ts
project-validator.ts
reparent-component.ts
snap-engine.ts
editor-canvas.tsx
```

Avoid:

```text
helpers.ts
utils2.ts
misc.ts
stuff.ts
common.ts
manager.ts
```

unless the name genuinely describes the responsibility.

Use kebab-case filenames unless the repository convention explicitly differs.

---

# 25. Generated Runtime Rules

Generated applications are based on:

- Expo
- React Native
- TypeScript
- Expo Router
- React Native Web
- react-native-safe-area-context

Keep the base generated dependency set small.

Do not install optional libraries into every generated app unless the project uses features that require them.

Generated projects should distinguish Reactively-managed code from user-managed custom code.

Conceptually:

```text
src/
├── generated/   ← Reactively-owned
├── custom/      ← user-owned
└── runtime/     ← Reactively runtime
```

Respect Expo Router's required folder conventions where necessary.

Never overwrite user-owned custom code during regeneration.

---

# 26. Generator Rules

Generation should use a pipeline, not scattered string templates inside UI components.

Preferred:

```text
ReactivelyProject
      ↓
Validation
      ↓
Normalization
      ↓
App IR
      ↓
Generator
      ↓
Generated Files
      ↓
Formatting / checks
```

The generator must not depend on Next.js or the editor UI.

Do not generate from DOM nodes or rendered React elements.

Generate only from the canonical project document / normalized IR.

---

# 27. Preview Rules

The default web preview should be isolated from the editor.

Preferred:

```text
Editor
   ↓
project/compiler
   ↓
Preview Runtime
   ↓
React Native Web
   ↓
isolated iframe
```

Benefits:

- CSS isolation
- runtime isolation
- error isolation
- viewport control
- reload/reset
- future console capture

Do not create an unrelated fake HTML preview engine when shared React Native Web semantics can be used.

Do not label web preview as fully native.

Native-only features may behave differently.

---

# 28. Platform Awareness

Every generated feature should account for:

```text
iOS
Android
Web
```

Support levels:

```text
full
adapted
limited
unsupported
```

Platform behavior belongs in explicit platform/component metadata.

Do not allow platform differences to become random conditional checks scattered across the editor.

Platform-specific generated implementations may eventually use:

```text
Component.ios.tsx
Component.android.tsx
Component.web.tsx
```

or:

```text
Component.native.tsx
Component.web.tsx
```

---

# 29. Routing

Generated apps use **Expo Router**.

Reactively screens/routes should be structured data, not manually written navigation code.

Keep route metadata separate from editor-specific UI state.

Do not prematurely implement complex routing features when only a single-screen MVP is required.

---

# 30. Button Semantics

For customizable generated buttons, prefer a Reactively runtime abstraction based on React Native `Pressable` + `Text`.

Do not rely on React Native's minimally customizable built-in `Button` for the primary visual builder component.

---

# 31. Marketing / Dashboard / Editor Separation

Do not import editor-heavy packages into the public marketing page.

Routes should remain conceptually separated:

```text
/                    marketing
/dashboard           project management
/editor/[projectId]  visual editor
/preview/[projectId] isolated preview
```

The editor should not inherit marketing navigation/layout.

Bundle boundaries matter because the editor will become very large.

---

# 32. UI Library

Use:

- Tailwind CSS
- Radix UI primitives
- Lucide React

Raw Radix primitives should generally be wrapped in reusable product UI components under:

```text
apps/web/components/ui/
```

Use design tokens / CSS variables instead of scattering hard-coded theme colors throughout components.

---

# 33. Drag and Drop

`dnd-kit` is available for:

- component library drag/drop
- layer sorting
- basic sortable structures

Do not assume the eventual Figma-style canvas movement system must be implemented entirely with dnd-kit.

Precise canvas interactions may require custom pointer logic.

Keep canvas interaction algorithms separate from the drag/drop library.

---

# 34. Error Handling

Do not silently swallow errors.

Errors should be:

- handled at the appropriate boundary
- reported clearly
- logged where useful
- converted to domain-friendly error results when crossing layers

Avoid broad:

```ts
try {
  ...
} catch {
}
```

Never ignore failures that may corrupt project state.

---

# 35. Validation

Validate persistent state before:

- loading it into the editor
- generating an app
- publishing/building
- importing external data

Structural validity and semantic validity are different concerns.

Use:

```text
Zod → structural validation
validation package → semantic/project validation
```

Examples of semantic checks:

- missing parent
- hierarchy cycle
- unsupported child
- invalid initial screen
- broken reference
- unsupported platform capability

---

# 36. TypeScript Rules

Use strict TypeScript.

Avoid:

```ts
any;
```

unless interfacing with unavoidable external APIs and the boundary is immediately narrowed.

Prefer:

- discriminated unions
- explicit domain types
- exhaustive switches where useful
- `unknown` for untrusted values
- Zod parsing at boundaries

Do not suppress compiler errors to make a task pass.

Avoid unnecessary non-null assertions.

---

# 37. Testing Expectations

New domain behavior should include tests.

Prefer unit tests for:

- schemas
- hierarchy operations
- commands
- validation
- layout calculations
- generator output
- migrations
- platform capability logic

Prefer component tests for:

- inspector controls
- layers behavior
- focused editor UI behavior

Use Playwright for:

- critical user workflows
- route smoke tests
- eventual project creation/edit/preview workflows

Do not use end-to-end tests to replace simple deterministic unit tests.

---

# 38. Required Quality Checks

Before completing a meaningful task, run the applicable repository commands.

Typically:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Run focused tests during development.

Do not claim a command passed unless it was actually executed successfully.

Do not leave the repository knowingly broken.

---

# 39. Refactoring Rule

When implementing a feature exposes an existing architectural problem, prefer fixing the underlying abstraction if:

- the fix is reasonably scoped
- it reduces future complexity
- it does not unexpectedly broaden the feature

Do not pile new behavior onto obviously broken structure just to minimize the diff.

However, do not rewrite unrelated systems during a small feature task.

---

# 40. Backward Compatibility

Persistent project documents will eventually outlive individual code versions.

Schema changes must consider migration.

Never casually rename/remove persisted fields without a migration strategy.

The project document should contain a schema version.

Future runtime/template versions should likewise be explicit.

---

# 41. Performance Principles

The visual editor is highly interactive.

Avoid architecture that requires full project rerenders for every pointer movement.

Prefer:

- focused Zustand selectors
- transient drag state separate from persistent project state
- memoization where justified
- batched persistent commits
- pure layout functions
- `requestAnimationFrame` for pointer-driven visual updates where appropriate

Do not prematurely optimize ordinary UI.

Profile before introducing complex performance architecture.

---

# 42. Pointer Interaction Principle

During drag/resize operations:

```text
pointer movement
     ↓
transient editor state
     ↓
visual feedback
```

Then on commit:

```text
final result
     ↓
project command
     ↓
persistent document
```

Do not persist to project storage/cloud for every mouse pixel movement.

---

# 43. Security

Never:

- commit secrets
- expose service-role keys to the browser
- trust arbitrary imported project JSON without validation
- execute arbitrary custom code inside the editor's main origin without isolation
- expose filesystem/native capabilities directly to untrusted web content

Future custom-code preview requires deliberate sandboxing.

---

# 44. Custom Code Boundary

Reactively-managed generated files and user-managed custom code must remain separate.

Do not promise arbitrary bidirectional source-code round-tripping.

Reactively owns the structured project model.

Users may eventually write custom:

- functions
- hooks
- services
- components

through explicit extension points.

Never regenerate over user-owned files.

---

# 45. GitHub Philosophy

GitHub integration is not required for the initial MVP.

When implemented later:

```text
Reactively Project
       ↓
Generator
       ↓
GitHub
```

Generated source is not automatically reverse-parsed back into Reactively.

Do not architect current systems around arbitrary two-way code synchronization.

---

# 46. Publishing Philosophy

Initial publishing/build strategy will use Expo/EAS where appropriate.

Reactively should eventually orchestrate:

```text
Project
 ↓
Validation
 ↓
Generation
 ↓
Build
 ↓
Signing
 ↓
Submission
```

Users should not have to understand low-level native tooling for ordinary workflows.

Do not build publishing before generator/native parity is proven.

---

# 47. Native/Web Parity Principle

Never assume:

```text
web preview == native behavior
```

The web preview is optimized for speed.

Actual iOS/Android verification remains necessary for:

- native modules
- safe-area differences
- keyboards
- system dialogs
- camera
- maps
- platform-specific controls
- permissions

The component registry/platform system must make limitations visible.

---

# 48. Do Not Guess Generated Code From Pixels

Reactively should never need to ask:

> "This rectangle visually overlaps that one, so maybe it belongs inside it."

The document explicitly contains:

```text
parent
children
layout properties
component type
```

Canvas geometry is an output of those semantics, not the primary source of truth.

---

# 49. Agent Workflow for Every Feature

Before coding:

1. Inspect the relevant existing packages/files.
2. Identify the current architecture and reusable abstractions.
3. Determine which layer owns the requested behavior.
4. Avoid creating a parallel implementation of an existing concept.
5. Identify whether persisted schema changes are required.
6. Identify tests that should prove the behavior.

During coding:

1. Work incrementally.
2. Keep typecheck passing as much as practical.
3. Keep UI components focused.
4. Extract domain logic.
5. Reuse the registry/schema/command architecture.
6. Avoid unrelated rewrites.

Before finishing:

1. Run relevant tests.
2. Run typecheck.
3. Run lint.
4. Run build when appropriate.
5. Report unresolved limitations truthfully.

---

# 50. Agent Completion Report

For substantial tasks, report:

1. What changed.
2. Files/packages affected.
3. New architecture introduced.
4. Existing architecture reused.
5. Schema changes.
6. State changes.
7. Persistence changes.
8. Tests added/updated.
9. Commands run and results.
10. Known limitations.
11. Recommended next step.

Do not claim manual/native verification unless it actually occurred.

---

# 51. Decision Heuristics

When uncertain, prefer the option that:

1. Keeps the project document canonical.
2. Keeps React Native semantics explicit.
3. Keeps UI separate from domain logic.
4. Keeps packages framework-independent where possible.
5. Keeps state ownership clear.
6. Is easy for another human developer to understand.
7. Is testable without rendering the whole application.
8. Preserves future Electron reuse.
9. Avoids unnecessary dependencies.
10. Produces deterministic generated applications.

---

# 52. Core Rule Summary

If only a few rules are remembered, remember these:

```text
Reactively Project = source of truth.

React Native semantics should be represented explicitly.

Visual components render; they should not own domain logic.

Persistent mutations go through commands/domain operations.

Zustand = editor/project client state.

TanStack Query = server state.

Dexie = local-first browser persistence.

Zod = runtime schema validation.

Supabase = infrastructure, not core architecture.

Core packages do not depend on Next.js.

Generated code is output, not the editor's source of truth.

Keep generated code separate from user-owned custom code.

Keep platform support explicit: iOS / Android / Web.

Prefer readable, testable, single-responsibility modules.

Do not overbuild beyond the current milestone.
```

---

# 53. Product Identity

Reactively should feel approachable to a beginner while remaining recognizable to an experienced React Native developer.

The product should not hide what makes React Native powerful.

It should make React Native visual.
