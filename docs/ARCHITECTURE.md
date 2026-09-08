# Reactively Architecture

## Purpose

Reactively is a visual React Native application builder. Its core promise is **React Native, visually**: users design application screens, component trees, styles, routes, behaviors, data bindings, and custom logic through a desktop UI while Reactively generates a maintainable React Native / Expo project that targets iOS, Android, and web.

The visual editor is not a mockup tool that later guesses code. The editor manipulates a structured application document whose concepts intentionally mirror React Native and Expo concepts.

## Architectural Principles

1. **The Reactively project document is the source of truth.** Generated React Native files are derived output.
2. **Generated code must be deterministic.** The same project document should produce materially identical generated output.
3. **Visual editing and runtime execution are separate systems.** Editor-only concepts such as selection handles and snapping never leak into the generated app.
4. **React Native semantics come first.** Layout, component hierarchy, routes, events, and platform behavior should map to real React Native concepts rather than proprietary approximations.
5. **Platform differences must be explicit.** iOS, Android, and web behavior should be represented through capability metadata and adapters rather than hidden hacks.
6. **User-owned custom code is protected from regeneration.** Generated files and user-authored files live in separate ownership boundaries.
7. **Local-first editing, cloud-backed durability.** Projects should remain usable locally while cloud sync provides backup, history, collaboration foundations, and account portability.
8. **Version everything that affects reproducibility.** Project schema, generated runtime, Expo SDK, component definitions, and migrations must be versioned.

## Recommended Repository Structure

```text
reactively/
├── apps/
│   ├── desktop/                 # Electron desktop application
│   │   ├── main/                # Node/Electron main process
│   │   ├── preload/             # secure IPC bridge
│   │   └── renderer/            # React editor UI
│   ├── web/                     # future browser editor
│   └── api/                     # backend/API service
│
├── packages/
│   ├── project-schema/          # canonical document model + validation
│   ├── component-registry/      # component metadata and capabilities
│   ├── layout-engine/           # editor-side layout calculation
│   ├── editor-engine/           # selection, drag, resize, snapping
│   ├── command-engine/          # mutations + undo/redo
│   ├── action-engine/           # events, actions, conditions
│   ├── data-engine/             # bindings, queries, mutations
│   ├── rn-ir/                   # normalized intermediate representation
│   ├── rn-generator/            # project -> generated React Native files
│   ├── rn-runtime/              # shared runtime package used by generated apps
│   ├── preview-runtime/         # React Native Web preview runtime
│   ├── platform/                # platform capability/adapters
│   ├── validation/              # build and publish validation
│   ├── migrations/              # project schema migrations
│   └── shared/                  # common utilities/types
│
├── services/
│   ├── preview-service/         # local/cloud preview orchestration
│   ├── build-service/           # native/web builds
│   ├── publishing-service/      # App Store / Play / web deployment
│   ├── github-service/          # GitHub repository sync
│   └── asset-service/           # uploads, hashing, optimization
│
├── templates/
│   └── expo-app/                # versioned generated app template
│
└── docs/
```

## System Overview

```text
                         Reactively Desktop
                                │
                                ▼
                    ┌─────────────────────┐
                    │   Project Document  │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
       Visual Editor      Preview Pipeline   Generator Pipeline
             │                 │                 │
             ▼                 ▼                 ▼
      Computed Layout      RN Web Runtime       React Native IR
                                                 │
                                                 ▼
                                        Versioned Expo Runtime
                                                 │
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                             iOS              Android              Web

Project Document also flows to:
- local save + undo history
- cloud sync + revisions
- GitHub export/sync
- publishing validation
```

## Desktop Application Boundary

Electron is a delivery shell, not the architecture itself.

### Electron Main Process

Owns privileged capabilities:

- filesystem access
- local project folders
- Git operations
- process execution
- preview server orchestration
- secure credential storage
- OS dialogs
- opening files/folders
- deep links
- update/install behavior

### Preload

Expose a narrow typed API through `contextBridge`.

Recommended security defaults:

```text
nodeIntegration = false
contextIsolation = true
sandbox = true where practical
```

### Renderer

Owns:

- pages/routes UI
- layers tree
- canvas
- component library
- inspector
- interactions
- data panel
- code viewer/editor for approved custom-code regions
- preview UX
- project settings

The renderer should never directly spawn processes or access arbitrary filesystem paths.

## Core State Separation

### Persistent Project State

Examples:

- project metadata
- screens/routes
- components
- hierarchy
- styles
- actions
- data bindings
- assets
- custom functions
- platform settings

### Ephemeral Editor State

Examples:

- selected node
- hovered node
- active panel
- zoom
- pan
- open accordion sections
- drag state
- snap guides
- selected device preview

Ephemeral state must not be serialized into the app document.

## Mutation Model

All persistent changes should go through commands.

Examples:

```text
AddNode
DeleteNode
MoveNode
ResizeNode
ReparentNode
UpdateProperty
AddScreen
DeleteScreen
ReorderChildren
AddAction
UpdateBinding
```

Pipeline:

```text
User Interaction
      ↓
Project Command
      ↓
Project State
  ┌───┼─────┐
  ▼   ▼     ▼
Undo Save  Cloud Sync
```

This makes undo/redo, audit history, autosave, and future collaboration much easier.

## End-to-End Lifecycle

```text
1. Launch Reactively
2. Authenticate or continue local-first
3. Create/open project
4. Load project document
5. Run schema migration if required
6. Validate document
7. Build editor tree + computed layout
8. User edits through commands
9. Autosave locally
10. Sync cloud operations + snapshots
11. Preview through RN Web runtime
12. Optionally preview on device/native build
13. Validate project for target platforms
14. Normalize project into RN IR
15. Generate deterministic Expo project
16. Typecheck/lint/test generated output
17. Build iOS / Android / web
18. Sign using user-owned credentials or delegated service
19. Submit/deploy
20. Store build/deployment metadata and logs
```

## Beta Scope Recommendation

Before building advanced integrations, prove this vertical slice:

```text
One project
One route
View
Text
Button
Image
TextInput

Parent/child hierarchy
Flex layout
Absolute positioning
Margin/padding/gap
Snapping
Selection + resize
Local project save
RN Web preview
Expo project generation
Native iOS + Android build
```

The milestone is successful when the same document renders closely in the editor, RN Web preview, iOS, and Android.
