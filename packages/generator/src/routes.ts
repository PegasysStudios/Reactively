/**
 * Route compilation.
 *
 * Reactively routes are user-facing application paths. Expo Router derives navigation
 * from the filesystem, so this is where the two representations meet. Reactively respects
 * Expo Router's conventions rather than inventing its own layout — the generated project
 * should look like a project an experienced React Native developer would have written.
 */

/**
 * Converts an application route into its Expo Router file path.
 *
 *     /                  -> app/index.tsx
 *     /settings          -> app/settings.tsx
 *     /profile/[userId]  -> app/profile/[userId].tsx
 */
export function routeToExpoRouterPath(route: string): string {
  const segments = route.split("/").filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return "app/index.tsx";
  }

  return `app/${segments.join("/")}.tsx`;
}

/**
 * Converts a screen name into a valid React component name.
 *
 *     "Home"          -> HomeScreen
 *     "user profile"  -> UserProfileScreen
 *     "404"           -> Screen404Screen is avoided; digits are prefixed instead
 */
export function screenComponentName(name: string): string {
  const pascal = name
    .split(/[^a-zA-Z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  if (pascal.length === 0) {
    return "UntitledScreen";
  }

  // React component names cannot start with a digit.
  const safe = /^[0-9]/.test(pascal) ? `Screen${pascal}` : pascal;
  return safe.endsWith("Screen") ? safe : `${safe}Screen`;
}
