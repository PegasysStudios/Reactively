# Reactively Publishing

## Goal

Reactively should turn a validated project into distributable iOS, Android, and web builds while hiding unnecessary native tooling complexity.

## Publishing Pipeline

```text
Reactively Project
       ↓
Validation
       ↓
Generate React Native Project
       ↓
Typecheck / Config Check
       ↓
Build
       ↓
Sign
       ↓
Submit / Deploy
       ↓
Track Status
```

## Target Platforms

### iOS

Required concepts:

```text
bundle identifier
version/build number
app icon
privacy usage descriptions
Apple developer credentials
signing/provisioning
App Store Connect metadata
```

### Android

Required concepts:

```text
package name
version code/version name
app icon
permissions
signing key
Google Play service account or authorized publishing connection
store metadata
```

### Web

Required concepts:

```text
web build output
base path
environment configuration
hosting destination
custom domain optional
```

## Build Infrastructure

For beta, prefer leveraging Expo/EAS-compatible build and submission infrastructure rather than operating a full custom macOS/Android build fleet.

Reactively should own orchestration and UX while user accounts/credentials remain properly scoped.

Do not make every customer's application owned by a single Reactively Expo account.

## Publish UI

Recommended flow:

```text
Publish

iOS
✓ Bundle identifier
✓ App icon
✓ Version
✓ Required permissions
✓ Apple connection
[ Build & Submit ]

Android
✓ Package name
✓ App icon
✓ Version
✓ Signing
✓ Google Play connection
[ Build & Submit ]

Web
✓ Build configuration
✓ Hosting target
[ Deploy ]
```

## Validation

Publishing must fail early with actionable errors.

Examples:

```text
Missing iOS bundle identifier
Camera component requires camera usage description
Apple Sign In unavailable on Android
Web target uses unsupported native-only component
Missing production environment variable
```

## Build Records

Persist build metadata:

```ts
interface BuildRecord {
  id: string;
  projectId: string;
  platform: "ios" | "android" | "web";
  projectRevision: number;
  runtimeVersion: string;
  status: "queued" | "building" | "failed" | "succeeded";
  createdAt: string;
  completedAt?: string;
  artifactUrl?: string;
  logsUrl?: string;
}
```

## Deployment Records

Track submissions separately from builds.

A successful binary build does not guarantee successful store submission.

Store:

```text
build ID
store target
submission state
store version/build number
submission timestamps
store response/errors
```

## Secrets

Publishing credentials must never be stored in the Reactively project JSON.

Use secure provider connections and project references.

## Reproducibility

A build record should identify:

```text
project revision
schema version
runtime version
Expo SDK
resolved dependency set
platform config
```

This enables debugging and future rebuilds.
