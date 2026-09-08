# Reactively

**React Native, visually.**

Reactively is a visual React Native application builder. You design screens, component
trees, styles and routes in a browser-based editor, and Reactively generates a
maintainable Expo / React Native / TypeScript project that builds for iOS, Android and
web.

It is not a mockup tool that later guesses at code. The editor manipulates a structured
application document whose concepts deliberately mirror React Native's own: `View`,
`Text`, `Pressable`, flexbox layout, safe areas, routes.

> **Status: foundation.** The monorepo, package boundaries, schemas, contracts, routes and
> test infrastructure exist. The visual editor itself does not — the editor route renders a
> shell with no editing behaviour, and the generator stops after building its intermediate
> representation.

## MVP definition

The first meaningful milestone is reached when Reactively can:

1. create and open a project
2. visually edit one screen
3. add `View`, `Text` and `Button`
4. create parent/child relationships
5. configure React Native layout and style properties
6. preview in-browser through React Native Web
7. save and reload the project
8. generate a clean Expo + React Native + TypeScript project
9. use Expo Router
10. build that project for iOS and Android
11. produce builds suitable for TestFlight / App Store and Google Play testing

## Source-of-truth philosophy

The **Reactively project document is the source of truth.** Generated React Native files
are derived output and are never read back.

Three rules follow from that, and most of this repository's structure exists to enforce
them:

- **Generation is deterministic.** The same document produces materially identical output,
  so a one-property visual edit produces a small, reviewable Git diff.
- **Project state and editor state are separate.** Screens, components and styles are
  persisted. Selection, hover, zoom, pan and drag are not, and never enter the document.
- **All persistent change flows through commands.** `UI -> command -> project store`, which
  is what makes undo, dirty tracking, autosave and eventual cloud sync work uniformly.

## Getting started

Requires **Node 20.9+** and **pnpm** (the repo pins its version through the `packageManager`
field, so `corepack enable pnpm` is enough).

```bash
pnpm install
pnpm dev
```

The web app runs at <http://localhost:3000>. No environment configuration is required:
Supabase is prepared as infrastructure but entirely optional, and projects persist to
IndexedDB in the browser.

## Commands

Run from the repository root.

| Command                             | What it does                                                         |
| ----------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                          | Builds the packages, then runs the Next.js dev server on port 3000   |
| `pnpm build`                        | Builds every package and the web application                         |
| `pnpm typecheck`                    | Type-checks every workspace project                                  |
| `pnpm lint`                         | ESLint across the monorepo, including package boundary rules         |
| `pnpm test`                         | Vitest unit and component tests                                      |
| `pnpm test:e2e`                     | Playwright smoke tests (builds and serves the app first — see below) |
| `pnpm format` / `pnpm format:check` | Prettier write / verify                                              |

`pnpm test:e2e` runs through Turborepo, whose `test:e2e` task declares `dependsOn: ["build"]`.
That produces a production build, and Playwright's `webServer` then starts `next start` on
port 3100 and shuts it down afterwards. Port 3100 is used so it never collides with a
`pnpm dev` server on 3000. Browsers are a one-time install:

```bash
pnpm --filter @reactively/web exec playwright install chromium
```

## Repository structure

```text
reactively/
├── apps/
│   └── web/                   Next.js host: marketing, dashboard, editor, preview
├── packages/                  Reusable, host-independent product logic
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
├── templates/
│   └── expo-app/              Versioned Expo template used to generate customer apps
├── tooling/                   Shared ESLint and TypeScript configurations
└── docs/                      Architecture documentation
```

## Architecture

Reactively is not "a Next.js app that happens to contain an editor". Next.js is the first
host; an Electron desktop shell and cloud build workers are expected to consume the same
packages.

```text
                Reactively Core
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Web App    Desktop App   Cloud Workers
       Next.js     (future)      (future)
```

Reusable packages therefore **must not import `next/*`**, Next.js server APIs or Next.js
routing APIs. ESLint enforces this; see `tooling/eslint-config/base.js`.

### Package responsibilities

| Package                          | Responsibility                                                                                                      | Depends on                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `@reactively/project-schema`     | The canonical project document: screens, nodes, styles, versioning. Zod schemas plus inferred types.                | `zod` only                                               |
| `@reactively/component-registry` | What Reactively can place and generate: `View`, `Text`, `Button`, their capabilities, properties and nesting rules. | project-schema, platform                                 |
| `@reactively/layout-engine`      | React Native flexbox semantics, computed-layout contracts, spacing normalization.                                   | project-schema, shared                                   |
| `@reactively/history`            | Command contract and the undo/redo stack.                                                                           | —                                                        |
| `@reactively/editor-engine`      | Host-independent editor state contracts and pure project mutations.                                                 | project-schema, history, shared                          |
| `@reactively/validation`         | Coherence checks beyond schema parsing: cycles, orphans, invalid nesting.                                           | project-schema, component-registry                       |
| `@reactively/generator`          | Project → validated → normalized → `AppIR` → Expo project files.                                                    | project-schema, component-registry, validation, platform |
| `@reactively/preview-runtime`    | Editor ↔ preview iframe protocol and session contracts.                                                             | project-schema                                           |
| `@reactively/generated-runtime`  | Runtime contracts (`VNView`, `VNText`, `VNButton`) used by generated apps.                                          | —                                                        |
| `@reactively/platform`           | iOS / Android / web targets and support levels.                                                                     | `zod` only                                               |
| `@reactively/shared`             | Genuinely generic utilities. Not a junk drawer.                                                                     | —                                                        |

Dependencies point one way only. No core package may depend on `apps/web`, and there are
no cycles.

## Generated app philosophy

Reactively owns a versioned template (`templates/expo-app`) rather than running
`create-expo-app` per generation. A scaffolder we do not control changes underneath us and
would make two generations of the same project differ.

Generated projects separate ownership explicitly:

```text
src/generated/   Reactively owns this. Regenerated every build; edits are lost.
src/runtime/     Reactively component wrappers.
src/custom/      You own this. Never overwritten.
```

Every generated app records the runtime version, Expo SDK and template version it was
built against, so an old project regenerates predictably instead of drifting onto whatever
Expo SDK is newest.

Dependencies are earned. The baseline is deliberately small, and the generator adds
packages only when a project uses a feature that needs them.

## Documentation

Long-form architecture lives in [`docs/`](./docs). Start with
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md); development setup and the rules for
adding packages are in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).
