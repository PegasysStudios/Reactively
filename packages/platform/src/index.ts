export {
  ALL_PLATFORMS,
  NATIVE_PLATFORMS,
  PLATFORM_LABELS,
  PlatformSchema,
  type Platform,
} from "./platform.js";

export {
  PlatformSupportSchema,
  SupportLevelSchema,
  intersectSupport,
  isSupportedOn,
  meetsSupportLevel,
  supportLevelFor,
  supportedPlatforms,
  universalSupport,
  unsupportedPlatforms,
  type PlatformSupport,
  type SupportLevel,
} from "./support.js";
