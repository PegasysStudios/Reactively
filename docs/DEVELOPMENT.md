# Reactively Development

Setup, monorepo conventions and the rules that keep package boundaries intact.

## Setup

Requires Node 20.9+ and pnpm. The repository pins its pnpm version through the
`packageManager` field, so Corepack will fetch the right one:

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

pnpm is the only supported package manager. `package-lock.json`, `yarn.lock` and
`bun.lockb` are git-ignored to make an accidental `npm install` visible rather than
silently divergent.

Playwright browsers install separately, once:

```bash
pnpm --filter @reactively/web exec playwright install chromium
```

## Commands

| Command                             | Scope                                                                 |
| ----------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                          | Turborepo: builds packages, then runs `next dev` on port 3000         |
| `pnpm build`                        | Turborepo: `tsc` per package, then `next build`                       |
| `pnpm typecheck`                    | `tsc` with no emit per workspace project                              |
| `pnpm lint`                         | A single root ESLint run over the whole monorepo                      |
| `pnpm test`                         | Vitest per workspace project                                          |
| `pnpm test:e2e`                     | Builds the web app, then Playwright against `next start` on port 3100 |
| `pnpm format` / `pnpm format:check` | Prettier                                                              |

### Turborepo runs tasks in strict environment mode

`turbo.json` declares `globalPassThroughEnv`, and that switches Turborepo into strict
environment mode: task processes see a filtered environment rather than the shell's. This
is deliberate — it stops a task from silently depending on an ambient variable that will
not exist in CI — but it means a variable a tool genuinely needs must be declared.

`PLAYWRIGHT_BROWSERS_PATH` is the case we already hit. CI images commonly set it to point
Playwright at a cached browser download, and without it declared on the `test:e2e` task,
Playwright falls back to its default location and fails to launch. If a tool works when
invoked directly but not under `turbo run`, a filtered environment variable is the first
thing to check.

### Why lint runs from the root

ESLint uses one flat config at the repository root rather than a config per package. The
boundary rules — "packages may not import Next.js", "no deep imports into another
package" — are cross-cutting, and keeping them in one file makes them auditable instead of
scattered across thirteen copies. The shared config itself lives in
`tooling/eslint-config` so a future Electron app can reuse it.

Linting is **not** type-aware. Type correctness is `pnpm typecheck`'s job; keeping ESLint
free of the TypeScript project service makes it fast and removes a build dependency.

## How the build works

Every package compiles with `tsc` to `dist/` and publishes its public API through the
package `exports` field. Consumers — including `apps/web` — import the built output, not
the source.

That means **a package must be built before anything can type-check against it**.
Turborepo expresses this with `dependsOn: ["^build"]` on the `build`, `typecheck` and
`test` tasks, so `pnpm typecheck` from a clean checkout builds dependencies first.

Two consequences worth knowing:

- `apps/web` does not need Next.js `transpilePackages`. The packages are plain ESM by the
  time Next sees them, which also proves they are consumable outside Next — a hard
  requirement for the future desktop shell and cloud workers.
- Packages are ESM (`"type": "module"`) compiled with `moduleResolution: "NodeNext"`, so
  relative imports inside a package carry explicit `.js` extensions. That is the TypeScript
  convention for emitting real Node ESM; it refers to the compiled file, not the source.

Each package has two TypeScript configs:

| File                  | Used by              | Difference                            |
| --------------------- | -------------------- | ------------------------------------- |
| `tsconfig.json`       | `typecheck`, editors | `noEmit`, includes test files         |
| `tsconfig.build.json` | `build`              | emits to `dist/`, excludes test files |

## Package dependency rules

Dependencies point in one direction. Adding an edge that is not listed here is a design
decision, not a convenience — raise it before doing it.

```text
shared            <- nothing
platform          <- zod
project-schema    <- zod
generated-runtime <- nothing
history           <- nothing

component-registry <- project-schema, platform
layout-engine      <- project-schema, shared
validation         <- project-schema, component-registry
editor-engine      <- project-schema, history, shared
preview-runtime    <- project-schema
generator          <- project-schema, component-registry, validation, platform

apps/web           <- any of the above
```

Hard rules:

1. **No core package may depend on `apps/web`**, or on any host application.
2. **No core package may import `next/*`**, Next.js server APIs or Next.js routing.
3. **No circular dependencies.**
4. **No deep imports.** Use `@reactively/project-schema`, never
   `@reactively/project-schema/src/internal/foo`.

Rules 1, 2 and 4 are enforced by `no-restricted-imports` in the root ESLint config.

### Why `editor-engine` does not depend on `component-registry`

The mutation layer needs nesting rules and component defaults, but it receives them
through `EditorCommandContext` instead of importing the registry. That keeps mutations
testable against a fake component set, and means user-defined custom components will
participate in exactly the same checks without a special case.
`apps/web/lib/editor/command-context.ts` is where the real registry is wired in.

### Core packages have no DOM and no Node types

Core packages deliberately compile without the DOM lib and without `@types/node`, because
they must run unchanged in the browser, in Node and in Hermes. The handful of universal
globals we rely on (`structuredClone`, `crypto.getRandomValues`) are declared in
`universal-globals.d.ts` alongside the code that uses them. If `fs` or `window` is what you
need, the code belongs in a host, not in a package.

## Adding a package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json` and
   `tsconfig.build.json`. Copy an existing package — they are deliberately uniform.
2. Name it `@reactively/<name>` and mark it `"private": true`.
3. Point `exports` at `./dist/index.js` with types at `./dist/index.d.ts`. Export the
   public API from `src/index.ts` only.
4. Add `build`, `typecheck`, `test` and `clean` scripts matching the existing packages.
5. Declare workspace dependencies as `"workspace:*"`, and add the new edge to the
   dependency table above.
6. Run `pnpm install`, then `pnpm build && pnpm typecheck && pnpm test`.

Do not add a dependency you are not importing yet. An aspirational dependency makes the
graph lie.

## Application boundaries

`apps/web` hosts four distinct surfaces, and they are separated on purpose:

| Route                  | Surface              | Constraint                                                           |
| ---------------------- | -------------------- | -------------------------------------------------------------------- |
| `/`                    | Public marketing     | Must not import editor code, project state, dnd-kit or the generator |
| `/dashboard`           | Project management   | Must not import the editor                                           |
| `/editor/[projectId]`  | Visual builder       | Own full-viewport shell; inherits no marketing chrome                |
| `/preview/[projectId]` | Isolated app preview | No editor components, no editor React state                          |

The editor will become the largest part of Reactively. A landing page that imports it
would ship the whole builder to every visitor, so
`apps/web/tests/route-boundaries.test.ts` walks the real import graph of each route and
fails if a forbidden module becomes reachable. That test is the enforcement; the table is
just documentation.

The preview is deliberately a separate route rather than a component, so the editor can
embed it in an iframe. The two communicate over `postMessage` using the protocol in
`@reactively/preview-runtime` — never through shared React context.

## State

Two stores, split by lifetime, not by feature:

- `useProjectStore` — the persistent document, plus dirty tracking and the undo stack.
- `useEditorStore` — selection, hover, viewport, open panels, drag state. Never saved.

React components do not mutate either directly. They call `projectCommands`, which routes
every change through history and dirty tracking. TanStack Query owns _server_ state
(users, projects, permissions, assets, builds) and is not the editor's document store.

## The Expo template

`templates/expo-app` is **not** a workspace member. It is versioned input data for
`@reactively/generator`, and adding React Native to the workspace would slow every install
and CI run for code the editor never executes. It also carries its own `.gitignore` and
`tsconfig.json` because it is materialized as a standalone project.

Work on it in isolation:

```bash
cd templates/expo-app
pnpm install --ignore-workspace
```

## Documentation

Long-form architecture documents in this directory predate the code and remain the design
intent. Where the implementation uses different names, the code is what shipped:

| Document                        | Code                                  |
| ------------------------------- | ------------------------------------- |
| `command-engine`                | `@reactively/history`                 |
| `rn-generator`, `rn-ir`         | `@reactively/generator` (IR included) |
| `rn-runtime`                    | `@reactively/generated-runtime`       |
| `apps/desktop` (Electron first) | `apps/web` first; desktop deferred    |

Packages that are documented but not yet created — `action-engine`, `data-engine`,
`migrations`, and the `services/*` tree — are intentionally deferred until there is a
feature that needs them.
