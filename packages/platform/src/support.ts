import { z } from "zod";

import { ALL_PLATFORMS, PlatformSchema, type Platform } from "./platform.js";

/**
 * How well a component or feature works on a given platform.
 *
 * - `full`        identical public API and effectively identical behaviour
 * - `adapted`     same feature, platform-specific implementation behind an adapter
 * - `limited`     works, but with caveats the user must be told about
 * - `unsupported` cannot be used on this platform
 */
export const SupportLevelSchema = z.enum(["full", "adapted", "limited", "unsupported"]);
export type SupportLevel = z.infer<typeof SupportLevelSchema>;

/**
 * Ordered weakest-to-strongest so support levels can be compared numerically.
 * Kept private: callers should use {@link meetsSupportLevel} rather than the raw ranks.
 */
const SUPPORT_LEVEL_RANK: Readonly<Record<SupportLevel, number>> = {
  unsupported: 0,
  limited: 1,
  adapted: 2,
  full: 3,
};

export const PlatformSupportSchema = z.object({
  ios: SupportLevelSchema,
  android: SupportLevelSchema,
  web: SupportLevelSchema,
  notes: z.partialRecord(PlatformSchema, z.string()).optional(),
});

export type PlatformSupport = z.infer<typeof PlatformSupportSchema>;

/** Support map for a feature that behaves identically everywhere. */
export function universalSupport(): PlatformSupport {
  return { ios: "full", android: "full", web: "full" };
}

/** Reads the support level for a single platform. */
export function supportLevelFor(support: PlatformSupport, platform: Platform): SupportLevel {
  return support[platform];
}

/** True when the platform's support level is at least `minimum`. */
export function meetsSupportLevel(
  support: PlatformSupport,
  platform: Platform,
  minimum: SupportLevel,
): boolean {
  return SUPPORT_LEVEL_RANK[support[platform]] >= SUPPORT_LEVEL_RANK[minimum];
}

/** True when the feature is usable at all on the platform. */
export function isSupportedOn(support: PlatformSupport, platform: Platform): boolean {
  return support[platform] !== "unsupported";
}

/** Every platform where the feature is usable at all. */
export function supportedPlatforms(support: PlatformSupport): Platform[] {
  return ALL_PLATFORMS.filter((platform) => isSupportedOn(support, platform));
}

/** Every platform the feature cannot run on. Drives publishing and preview warnings. */
export function unsupportedPlatforms(support: PlatformSupport): Platform[] {
  return ALL_PLATFORMS.filter((platform) => !isSupportedOn(support, platform));
}

/**
 * Combines the support maps of several features into the weakest common denominator.
 *
 * A screen is only as portable as its least portable component, so composing support
 * this way is what will eventually drive "this project cannot ship to web" validation.
 */
export function intersectSupport(supports: readonly PlatformSupport[]): PlatformSupport {
  return ALL_PLATFORMS.reduce<PlatformSupport>(
    (accumulated, platform) => {
      const weakest = supports.reduce<SupportLevel>((lowest, support) => {
        return SUPPORT_LEVEL_RANK[support[platform]] < SUPPORT_LEVEL_RANK[lowest]
          ? support[platform]
          : lowest;
      }, "full");

      return { ...accumulated, [platform]: weakest };
    },
    { ...universalSupport() },
  );
}
