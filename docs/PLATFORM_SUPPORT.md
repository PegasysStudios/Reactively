# Reactively Platform Support

## Goal

Reactively targets iOS, Android, and web from one React Native / Expo project while making platform limitations explicit.

## Support Levels

Every built-in component and feature declares support per platform.

```ts
type SupportLevel = "full" | "adapted" | "limited" | "unsupported";
```

Example:

```ts
interface PlatformSupportDefinition {
  ios: SupportLevel;
  android: SupportLevel;
  web: SupportLevel;
  notes?: Partial<Record<"ios" | "android" | "web", string>>;
}
```

## Three Classes of Feature

### Universal

Same public Reactively API and effectively same behavior everywhere.

Examples:

```text
View
Text
Image
Button
TextInput
basic navigation
Flexbox layout
```

### Adapted

Same Reactively feature with platform-specific implementation.

Examples:

```text
date picker
file picker
maps
share sheet
camera UI
```

Implementation may use:

```text
Feature.ios.tsx
Feature.android.tsx
Feature.web.tsx
```

### Platform-Specific

Feature exists only for certain targets.

Examples:

```text
Apple Sign In
Android-only intents
platform-specific system APIs
```

Reactively should visibly label this before users depend on it.

## Capability Manifest

Projects should derive a capability manifest from used components/features.

Example:

```json
{
  "camera": true,
  "location": false,
  "pushNotifications": true,
  "appleSignIn": true
}
```

The manifest drives:

- Expo/native config
- permissions
- preview compatibility
- publishing validation
- dependency selection

## Web Compatibility

Do not assume every native package has a valid web implementation.

Rules:

1. Prefer universal Expo/React Native libraries.
2. Prefer adapters over inline platform checks scattered throughout generated screens.
3. Treat web support as a first-class requirement in component definitions.
4. Provide explicit fallback behavior when possible.
5. Block generation only when a feature truly cannot support the requested target.

## Platform Conditions

Future advanced support may allow:

```text
Visible on:
✓ iOS
✓ Android
☐ Web
```

Store these as explicit conditions, not layout hacks.

## Testing Matrix

Every built-in component should eventually have automated or visual validation across:

```text
RN Web
Android
IOS
```

Critical layout fixtures should run on at least one representative small and large viewport per platform family.
