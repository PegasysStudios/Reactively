import { describe, expect, it } from "vitest";

import {
  intersectSupport,
  isSupportedOn,
  meetsSupportLevel,
  supportLevelFor,
  supportedPlatforms,
  universalSupport,
  unsupportedPlatforms,
  type PlatformSupport,
} from "./support.js";

const cameraSupport: PlatformSupport = {
  ios: "full",
  android: "full",
  web: "limited",
  notes: { web: "Web preview simulates the camera." },
};

const appleSignInSupport: PlatformSupport = {
  ios: "full",
  android: "unsupported",
  web: "unsupported",
};

describe("platform capability helpers", () => {
  it("reads the support level for a single platform", () => {
    expect(supportLevelFor(cameraSupport, "ios")).toBe("full");
    expect(supportLevelFor(cameraSupport, "web")).toBe("limited");
  });

  it("treats anything above unsupported as usable", () => {
    expect(isSupportedOn(cameraSupport, "web")).toBe(true);
    expect(isSupportedOn(appleSignInSupport, "android")).toBe(false);
  });

  it("compares support levels by strength", () => {
    expect(meetsSupportLevel(cameraSupport, "web", "limited")).toBe(true);
    expect(meetsSupportLevel(cameraSupport, "web", "full")).toBe(false);
    expect(meetsSupportLevel(cameraSupport, "ios", "adapted")).toBe(true);
  });

  it("lists supported and unsupported platforms", () => {
    expect(supportedPlatforms(appleSignInSupport)).toEqual(["ios"]);
    expect(unsupportedPlatforms(appleSignInSupport)).toEqual(["android", "web"]);
    expect(supportedPlatforms(universalSupport())).toEqual(["ios", "android", "web"]);
  });

  it("reduces combined features to the weakest common support", () => {
    expect(intersectSupport([cameraSupport, appleSignInSupport])).toEqual({
      ios: "full",
      android: "unsupported",
      web: "unsupported",
    });
  });

  it("returns full support when nothing constrains the feature set", () => {
    expect(intersectSupport([])).toEqual(universalSupport());
  });
});
