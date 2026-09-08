# Reactively Preview System

## Goal

Reactively should provide a fast preview loop that does not require users to manually manage Xcode, Android Studio, simulators, or native rebuilds for ordinary visual changes.

## Preview Tiers

### Tier 1 — Instant Preview

Default preview experience.

```text
Reactively Project
      ↓
Preview Runtime
      ↓
React Native Web / Expo Web
      ↓
Embedded Electron Browser View
```

Target feedback time: seconds or less after ordinary visual edits.

Use this for:

- layout
- typography
- component styling
- route flows
- most interactions
- data-bound UI

### Tier 2 — Device Preview

Provide a QR/device workflow for actual iOS/Android hardware.

Beta options:

- Expo Go when the project's dependencies are Expo Go-compatible
- later: a dedicated Reactively Preview companion app containing Reactively-supported native modules

The project capability system must determine whether a project can run in Expo Go.

### Tier 3 — Native Build Preview

Use for full verification when custom native code or native capabilities are required.

This may use local native tooling or cloud builds.

It is slower and should not be the default design loop.

## Embedded Preview Architecture

The Electron main process owns a local preview server/process.

```text
Renderer
   │ start preview
   ▼
Electron Main
   │
   ├── materialize preview project
   ├── ensure dependencies
   ├── start Metro/web server
   └── return local URL
                │
                ▼
         Embedded Preview
```

The renderer should not spawn Metro directly.

## Preview Isolation

Preview should use generated or normalized runtime output, not editor DOM components.

The canvas and preview must independently render from the same project model.

This is how Reactively detects parity bugs rather than accidentally hiding them.

## Fast Refresh

Ordinary changes should update preview without native rebuilds.

Examples that should not require native rebuild:

```text
text
colors
spacing
layout
screen hierarchy
routes
most JavaScript logic
bindings
custom TypeScript functions
```

Examples that may require a development build/native rebuild:

```text
new native dependency
native config plugin changes
native permissions/capabilities
Expo SDK upgrade
custom native module
```

## Preview Status Model

Recommended state machine:

```text
Idle
Preparing
InstallingDependencies
StartingServer
Ready
Refreshing
Failed
Stopping
```

Native preview may add:

```text
Building
Installing
Launching
```

## Device Frames

Device frames are presentation only.

The actual preview viewport should be configurable independently:

```text
iPhone portrait
Android portrait
small phone
large phone
tablet
custom viewport
```

Do not treat device-frame chrome as part of application coordinates.

## Platform Warnings

Preview must communicate when web behavior differs from native.

Example:

```text
⚠ Camera is simulated in web preview.
Use Device Preview for final verification.
```

The component capability matrix powers these warnings.

## Logging

Each preview session should have:

- concise user-facing lifecycle logs
- full technical logs
- copy logs
- open log file
- session ID

Avoid dumping huge compiler banners into the normal UI unless needed.

## Long-Term Cloud Preview

Possible later architecture:

```text
Reactively
   ↓
Cloud preview worker
   ↓
Native simulator/emulator
   ↓
streamed video + input
   ↓
Preview tab
```

This should not block beta.
