/**
 * Everything that affects reproducibility is versioned.
 *
 * A project document records which schema it was written against, which Reactively
 * runtime its generated app should use, and which Expo SDK that runtime targets. A
 * document written by a newer Reactively must fail safely (read-only) rather than be
 * silently rewritten by an older client.
 */

/** Version of the project document shape itself. Bump requires a migration. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Version of @reactively/generated-runtime that generated apps depend on. */
export const CURRENT_RUNTIME_VERSION = "0.1.0";

/** Expo SDK the generated app template targets. */
export const CURRENT_EXPO_SDK_VERSION = "57";

/** Version of templates/expo-app used to materialize generated projects. */
export const CURRENT_TEMPLATE_VERSION = "1";
