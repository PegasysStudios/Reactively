import { z } from "zod";

/**
 * Reactively targets iOS, Android and web from a single project document.
 *
 * Platform differences are represented explicitly through capability metadata rather
 * than hidden behind runtime hacks. See docs/PLATFORM_SUPPORT.md.
 */
export const PlatformSchema = z.enum(["ios", "android", "web"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const ALL_PLATFORMS: readonly Platform[] = ["ios", "android", "web"] as const;

/** Native platforms share React Native semantics that web must approximate. */
export const NATIVE_PLATFORMS: readonly Platform[] = ["ios", "android"] as const;

export const PLATFORM_LABELS: Readonly<Record<Platform, string>> = {
  ios: "iOS",
  android: "Android",
  web: "Web",
};
