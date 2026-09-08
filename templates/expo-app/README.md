# Reactively Expo template

The versioned, known-good Expo project that Reactively materializes into a generated
application. It is **not** a workspace package — it is input data for
`@reactively/generator`, which is why it is excluded from `pnpm-workspace.yaml`.

Reactively owns this template rather than running `create-expo-app` per generation. A
template we control is reproducible, reviewable and versioned; a scaffolder we do not
control changes underneath us and would make two generations of the same project differ.

## Versioning

`reactively.json` records the markers a generated app is pinned to:

```json
{
  "reactivelyRuntimeVersion": "0.1.0",
  "expoSdkVersion": "57",
  "templateVersion": "1",
  "projectSchemaVersion": 1
}
```

A project generated against SDK 57 keeps generating against SDK 57 until it is explicitly
migrated. Apps must not silently move to whatever Expo SDK happens to be newest.

## Structure

```text
templates/expo-app/
├── app/                      Expo Router routes (Reactively-owned)
│   ├── _layout.tsx           root navigator, safe-area provider, status bar
│   └── index.tsx             route "/" -> HomeScreen
├── src/
│   ├── generated/            Reactively-owned; regenerated every build
│   │   ├── screens/
│   │   └── theme/
│   ├── runtime/              VNView / VNText / VNButton wrappers
│   └── custom/               user-owned; never overwritten
├── app.json
├── package.json
├── reactively.json
└── tsconfig.json
```

Expo Router requires `app/` at the project root, so route files live there rather than
under `src/generated/`. Screen implementations still live in `src/generated/screens/`, and
route files are thin re-exports — the ownership boundary is preserved without fighting the
framework.

## Dependency policy

The baseline is deliberately small:

```text
expo, expo-router, expo-constants, expo-linking, expo-status-bar,
react, react-dom, react-native, react-native-web,
react-native-safe-area-context, react-native-screens, @expo/metro-runtime
```

State management, forms and data fetching are **not** installed by default. The generator
adds dependencies when a project actually uses a feature that requires them, so a simple
app ships a simple `package.json`.

## Platform-specific files

When behaviour genuinely differs per platform, add sibling files rather than branching
inside a shared component:

```text
VNDatePicker.ios.tsx
VNDatePicker.android.tsx
VNDatePicker.web.tsx
```

None exist yet; View, Text and Button behave the same everywhere apart from the press
feedback `VNButton` already normalizes.

## Status

This template has **not** yet been installed or built. It is authored against Expo SDK 57
conventions, but iOS, Android and web builds are unverified. Before wiring it into
generation, run:

```bash
cd templates/expo-app
pnpm install --ignore-workspace
npx expo install --check    # aligns versions with the pinned Expo SDK
pnpm typecheck
npx expo start --web
```
